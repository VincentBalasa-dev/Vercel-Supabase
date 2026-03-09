const supabase = require('../supabase')

async function requireAuth(req, res, next) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = auth.split(' ')[1]

  try {
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user) return res.status(401).json({ error: 'Invalid token' })
    req.user = data.user
    next()
  } catch (err) {
    res.status(401).json({ error: 'Token verification failed' })
  }
}

module.exports = { requireAuth }
