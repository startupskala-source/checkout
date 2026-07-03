module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    has_token: !!process.env.MP_ACCESS_TOKEN,
    has_key: !!process.env.MP_PUBLIC_KEY,
    token_prefix: process.env.MP_ACCESS_TOKEN ? process.env.MP_ACCESS_TOKEN.substring(0, 10) : 'none',
    node_version: process.version
  });
};
