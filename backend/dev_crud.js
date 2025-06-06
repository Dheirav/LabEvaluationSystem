#!/usr/bin/env node

// Developer CLI tool for CRUD operations on any MongoDB collection (menu-based, field prompts for users, bcrypt password, pick-to-delete)
// Usage: node dev_crud.js
// Requires: npm install inquirer bcryptjs

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const inquirer = require('inquirer');
const bcrypt = require('bcryptjs');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const userFields = [
  { type: 'input', name: 'name', message: 'Name:' },
  { type: 'input', name: 'user_id', message: 'User ID:' },
  { type: 'password', name: 'password', message: 'Password:' },
  { type: 'list', name: 'role', message: 'Role:', choices: ['admin', 'faculty', 'student'], default: 'student' },
];

async function getCollections() {
  const collections = await mongoose.connection.db.listCollections().toArray();
  return collections.map(c => c.name);
}

async function listDocuments(collection) {
  const docs = await mongoose.connection.db.collection(collection).find({}).toArray();
  console.log('\nDocuments:');
  docs.forEach(doc => console.log(JSON.stringify(doc, null, 2)));
}

async function createDocument(collection) {
  let data;
  if (collection === 'users') {
    data = await inquirer.prompt(userFields);
    // Hash the password like the register route
    const salt = await bcrypt.genSalt(10);
    data.password = await bcrypt.hash(data.password, salt);
  } else {
    const { json } = await inquirer.prompt([
      { type: 'input', name: 'json', message: 'Enter document as JSON:' }
    ]);
    try {
      data = JSON.parse(json);
    } catch (e) {
      console.error('Invalid JSON:', e.message);
      return;
    }
  }
  try {
    const result = await mongoose.connection.db.collection(collection).insertOne(data);
    console.log('Inserted:', result.insertedId);
  } catch (e) {
    console.error('Insert error:', e.message);
  }
}

async function updateDocument(collection) {
  const { id } = await inquirer.prompt([
    { type: 'input', name: 'id', message: 'Enter _id of document to update:' }
  ]);
  let data = {};
  if (collection === 'users') {
    for (const field of userFields) {
      const { [field.name]: value } = await inquirer.prompt([
        { ...field, message: `Update ${field.message} (leave blank to skip):`, default: undefined }
      ]);
      if (value !== '') {
        if (field.name === 'password') {
          // Hash new password if provided
          const salt = await bcrypt.genSalt(10);
          data[field.name] = await bcrypt.hash(value, salt);
        } else {
          data[field.name] = value;
        }
      }
    }
    // Remove empty fields
    Object.keys(data).forEach(k => { if (data[k] === '') delete data[k]; });
  } else {
    const { json } = await inquirer.prompt([
      { type: 'input', name: 'json', message: 'Enter update as JSON (fields to set):' }
    ]);
    try {
      data = JSON.parse(json);
    } catch (e) {
      console.error('Invalid JSON:', e.message);
      return;
    }
  }
  try {
    const { ObjectId } = require('mongodb');
    const result = await mongoose.connection.db.collection(collection).updateOne({ _id: new ObjectId(id) }, { $set: data });
    console.log('Matched:', result.matchedCount, 'Modified:', result.modifiedCount);
  } catch (e) {
    console.error('Update error:', e.message);
  }
}

async function deleteDocument(collection) {
  if (collection === 'users') {
    // List all users and let the user pick one to delete
    const docs = await mongoose.connection.db.collection('users').find({}).toArray();
    if (docs.length === 0) {
      console.log('No users to delete.');
      return;
    }
    const choices = docs.map(doc => ({
      name: `${doc.name} (${doc.user_id}, ${doc.role}) [${doc._id}]`,
      value: doc._id.toString()
    }));
    const { id } = await inquirer.prompt([
      { type: 'list', name: 'id', message: 'Select user to delete:', choices }
    ]);
    try {
      const { ObjectId } = require('mongodb');
      const result = await mongoose.connection.db.collection('users').deleteOne({ _id: new ObjectId(id) });
      console.log('Deleted:', result.deletedCount);
    } catch (e) {
      console.error('Delete error:', e.message);
    }
  } else {
    const { id } = await inquirer.prompt([
      { type: 'input', name: 'id', message: 'Enter _id of document to delete:' }
    ]);
    try {
      const { ObjectId } = require('mongodb');
      const result = await mongoose.connection.db.collection(collection).deleteOne({ _id: new ObjectId(id) });
      console.log('Deleted:', result.deletedCount);
    } catch (e) {
      console.error('Delete error:', e.message);
    }
  }
}

async function mainMenu() {
  while (true) {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Choose an action:',
        choices: [
          'List collections',
          'List documents',
          'Create document',
          'Update document',
          'Delete document',
          'Exit'
        ]
      }
    ]);

    if (action === 'Exit') break;

    if (action === 'List collections') {
      const collections = await getCollections();
      console.log('\nCollections:', collections.join(', '));
    } else {
      const collections = await getCollections();
      if (collections.length === 0) {
        console.log('No collections found.');
        continue;
      }
      const { collection } = await inquirer.prompt([
        {
          type: 'list',
          name: 'collection',
          message: 'Select collection:',
          choices: collections
        }
      ]);
      if (action === 'List documents') {
        await listDocuments(collection);
      } else if (action === 'Create document') {
        await createDocument(collection);
      } else if (action === 'Update document') {
        await updateDocument(collection);
      } else if (action === 'Delete document') {
        await deleteDocument(collection);
      }
    }
    console.log('\n---');
  }
}

async function main() {
  await mongoose.connect(MONGO_URI);
  await mainMenu();
  await mongoose.disconnect();
  console.log('Disconnected.');
}

main(); 