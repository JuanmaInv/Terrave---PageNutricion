const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.lomqrqlatceelvwkyiog:JuanmaInvaldi%40@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});
client.connect()
  .then(() => client.query('SELECT fecha, color, aroma, firmeza, untuosidad, sabor_tostado, persistencia, aceptacion FROM encuestas LIMIT 5;'))
  .then(res => { console.log(res.rows); client.end(); })
  .catch(console.error);
