const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { readJson, writeJson } = require('../lib/db')

const USERS_PATH = 'data/users.json'

function getUsers() {
  return readJson(USERS_PATH)
}

function saveUsers(users) {
  writeJson(USERS_PATH, users)
}

function findByMobile(mobile) {
  const users = getUsers()
  return users.find(user => user.mobile === mobile)
}

function listUsers() {
  return getUsers()
}

function verifyPassword(user, password) {
  if (user.password) {
    return user.password === password
  }
  return bcrypt.compareSync(password, user.passwordHash)
}

function signUser(user) {
  return jwt.sign(
    {
      id: user.id,
      mobile: user.mobile,
      nickname: user.nickname
    },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '7d' }
  )
}

function createUser({ mobile, password, nickname }) {
  const users = getUsers()
  const normalizedMobile = String(mobile || '').trim()
  const normalizedPassword = String(password || '').trim()
  const normalizedNickname = String(nickname || normalizedMobile).trim()

  if (!normalizedMobile) {
    throw new Error('mobile is required')
  }

  if (!normalizedPassword) {
    throw new Error('password is required')
  }

  if (users.some(user => user.mobile === normalizedMobile)) {
    throw new Error('mobile already exists')
  }

  const now = new Date().toISOString()
  const nextUser = {
    id: users.length ? Math.max(...users.map(user => Number(user.id || 0))) + 1 : 1,
    mobile: normalizedMobile,
    nickname: normalizedNickname,
    password: normalizedPassword,
    passwordHash: bcrypt.hashSync(normalizedPassword, 10),
    status: 'active',
    createdAt: now,
    updatedAt: now
  }

  users.push(nextUser)
  saveUsers(users)
  return nextUser
}

function deleteUser(userId) {
  const users = getUsers()
  const nextUsers = users.filter(user => user.id !== userId)
  if (nextUsers.length === users.length) {
    throw new Error('user not found')
  }

  saveUsers(nextUsers)
  return true
}

module.exports = {
  createUser,
  deleteUser,
  findByMobile,
  listUsers,
  verifyPassword,
  signUser
}
