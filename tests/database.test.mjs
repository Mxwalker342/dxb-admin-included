import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';

test('Postgres checkout validation, idempotency, permissions and staff policies', async t => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
      grant usage on schema public, auth to anon, authenticated; grant execute on function auth.jwt() to anon, authenticated;`);
    await db.exec(await readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8'));
    await db.exec(await readFile(new URL('../supabase/seed.sql', import.meta.url), 'utf8'));
    const day = new Date(Date.now() + 86400000).toISOString().slice(0,10);
    const payload = {name:'Local Test',phone:'9999999999',kind:'pickup',scheduled_at:day+'T12:30:00+05:30',guests:null,notes:'test only',items:[{id:'burgers-0-0',quantity:2,price:381}]};
    const place = async (data, id = randomUUID()) => (await db.query('select public.place_order($1,$2) as receipt',[id,JSON.stringify(data)])).rows[0].receipt;
    await db.exec('set role anon');
    let receipt;
    await t.test('guest creates an order; identical retry creates no duplicate', async () => {
      const id = randomUUID(); receipt = await place(payload,id);
      assert.equal(receipt.total,762); assert.equal(receipt.items[0].name,'Xtreme Boss Burger (beef)');
      assert.deepEqual(await place(payload,id), receipt);
      await assert.rejects(place({...payload,name:'Edited'},id), /already submitted/);
    });
    await t.test('tampered price, quantity, time, kind and empty orders are rejected', async () => {
      for (const data of [
        {...payload,items:[{id:'burgers-0-0',quantity:2,price:1}]},
        {...payload,items:[{id:'burgers-0-0',quantity:21,price:381}]},
        {...payload,items:[...payload.items,...payload.items]},
        {...payload,scheduled_at:day+'T04:30:00+05:30'},
        {...payload,scheduled_at:'2000-01-01T12:00:00+05:30'},
        {...payload,kind:'delivery'}, {...payload,items:[]}, {...payload,items:null},
      ]) await assert.rejects(place(data));
    });
    await t.test('table requests and dine-in orders validate guests', async () => {
      assert.equal((await place({...payload,kind:'reservation',guests:4,items:[]})).total,0);
      assert.equal((await place({...payload,kind:'dine-in',guests:2})).total,762);
      await assert.rejects(place({...payload,kind:'reservation',guests:0,items:[]}));
      await assert.rejects(place({...payload,kind:'reservation',guests:21,items:[]}));
    });
    await t.test('anonymous access cannot read orders or write catalogue', async () => {
      assert.equal((await db.query('select count(*)::int as count from public.menu_items')).rows[0].count,51);
      await assert.rejects(db.query('select * from public.orders'), /permission denied/);
      await assert.rejects(db.query('update public.menu_items set price=1'), /permission denied/);
    });
    await db.exec('reset role; set role authenticated');
    await t.test('ordinary authenticated user has no staff access', async () => {
      await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({user_metadata:{cafe_role:'admin'}})]);
      assert.equal((await db.query('select * from public.orders')).rows.length,0);
      assert.equal((await db.query('update public.menu_items set price=1 returning *')).rows.length,0);
    });
    await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({app_metadata:{cafe_role:'admin'}})]);
    await t.test('staff sees orders, updates statuses and prices but cannot rewrite totals', async () => {
      assert.equal((await db.query('select * from public.orders')).rows.length,3);
      const updated = await db.query("update public.orders set status='confirmed',payment_status='paid' where reference=$1 returning status",[receipt.reference]);
      assert.equal(updated.rows[0].status,'confirmed');
      await assert.rejects(db.query('update public.orders set total=1'), /permission denied/);
      await db.query("update public.menu_items set available=false where id='burgers-0-0'");
      await assert.rejects(place(payload), /no longer available/);
      await db.query("update public.menu_items set available=true,price=400 where id='burgers-0-0'");
      await assert.rejects(place(payload), /price changed/);
    });
    await db.exec('set role anon');
    await t.test('per-phone throttle stops sixth booking', async () => {
      const table = {...payload,phone:'8888888888',kind:'reservation',guests:2,items:[]};
      for (let i=0;i<5;i++) await place(table);
      await assert.rejects(place(table), /Too many requests/);
    });
  } finally { await db.close(); }
});
