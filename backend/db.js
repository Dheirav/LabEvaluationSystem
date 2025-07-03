#!/usr/bin/env node

// Developer CLI tool for CRUD operations on any MongoDB collection (menu-based, field prompts for users, bcrypt password, pick-to-delete)
// Usage: node dev_crud.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const inquirer = require('inquirer');
const bcrypt = require('bcryptjs');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const userFields = [
  { type: 'input', name: 'name', message: 'Name:' },
  { type: 'input', name: 'user_id', message: 'User ID:' },
  { type: 'input', name: 'roll_number', message: 'Roll Number:' },
  { type: 'password', name: 'password', message: 'Password:' },
  { type: 'list', name: 'role', message: 'Role:', choices: ['admin', 'faculty', 'student'], default: 'student' },
];

// Field prompts for each major collection
const fieldPrompts = {
  users: userFields,
  courses: [
    { type: 'input', name: 'name', message: 'Course Name:' },
    { type: 'input', name: 'code', message: 'Course Code:' },
    { type: 'input', name: 'semester', message: 'Semester:' },
    { type: 'input', name: 'parameters', message: 'Parameters (JSON, optional):', default: '{}' }
  ],
  tests: [
    { type: 'input', name: 'name', message: 'Test Name:' },
    { type: 'input', name: 'course', message: 'Course ObjectId:' },
    { type: 'input', name: 'questions', message: 'Question ObjectIds (comma separated):', default: '' },
    { type: 'input', name: 'date', message: 'Date (YYYY-MM-DD):' },
    { type: 'input', name: 'time', message: 'Time (e.g., 10:00 AM - 12:00 PM):' },
    { type: 'input', name: 'createdBy', message: 'Created By (User ObjectId):' },
    { type: 'input', name: 'metadata', message: 'Metadata (JSON, optional):', default: '{}' },
    { type: 'confirm', name: 'allowTabSwitch', message: 'Allow Tab Switch?', default: false },
    { type: 'confirm', name: 'allowExternalCopyPaste', message: 'Allow External Copy/Paste?', default: false },
    { type: 'confirm', name: 'allowInternalCopyPaste', message: 'Allow Internal Copy/Paste?', default: true },
    { type: 'confirm', name: 'enforceFullscreen', message: 'Enforce Fullscreen?', default: false }
  ],
  questions: [
    { type: 'input', name: 'course', message: 'Course ObjectId:' },
    { type: 'input', name: 'title', message: 'Title:' },
    { type: 'input', name: 'description', message: 'Description:' },
    { type: 'input', name: 'expectedAnswer', message: 'Expected Answer:' },
    { type: 'input', name: 'tags', message: 'Tags (comma separated):', default: '' },
    { type: 'input', name: 'details', message: 'Details (JSON, optional):', default: '{}' },
    { type: 'input', name: 'createdBy', message: 'Created By (User ObjectId):' }
  ],
  questionpools: [
    { type: 'input', name: 'course', message: 'Course ObjectId:' },
    { type: 'input', name: 'test', message: 'Test ObjectId (optional):', default: '' },
    { type: 'input', name: 'questions', message: 'Question ObjectIds (comma separated):', default: '' }
  ],
  evaluations: [
    { type: 'input', name: 'faculty', message: 'Faculty (User ObjectId):' },
    { type: 'input', name: 'course', message: 'Course ObjectId:' },
    { type: 'input', name: 'test', message: 'Test ObjectId:' },
    { type: 'input', name: 'student', message: 'Student (User ObjectId):' },
    { type: 'list', name: 'status', message: 'Status:', choices: ['pending', 'completed'], default: 'pending' },
    { type: 'input', name: 'marksObtained', message: 'Marks Obtained (optional):', default: '' },
    { type: 'input', name: 'evaluatedAt', message: 'Evaluated At (YYYY-MM-DD, optional):', default: '' }
  ],
  facultycourses: [
    { type: 'input', name: 'facultyId', message: 'Faculty (User ObjectId):' },
    { type: 'input', name: 'courseId', message: 'Course ObjectId:' },
    { type: 'input', name: 'batch', message: 'Batch:' },
    { type: 'input', name: 'semester', message: 'Semester:' },
    { type: 'input', name: 'assignedDate', message: 'Assigned Date (YYYY-MM-DD, optional):', default: '' }
  ],
  labmanuals: [
    { type: 'input', name: 'course', message: 'Course ObjectId:' },
    { type: 'input', name: 'faculty', message: 'Faculty (User ObjectId):' },
    { type: 'input', name: 'filename', message: 'Filename:' },
    { type: 'input', name: 'originalname', message: 'Original Name:' },
    { type: 'input', name: 'uploadDate', message: 'Upload Date (YYYY-MM-DD, optional):', default: '' },
    { type: 'input', name: 'batch', message: 'Batch (N/P/Q):' },
    { type: 'input', name: 'title', message: 'Title (optional):', default: '' }
  ],
  schedules: [
    { type: 'input', name: 'faculty', message: 'Faculty (User ObjectId):' },
    { type: 'input', name: 'course', message: 'Course ObjectId:' },
    { type: 'input', name: 'date', message: 'Date (YYYY-MM-DD):' },
    { type: 'input', name: 'time', message: 'Time:' },
    { type: 'list', name: 'type', message: 'Type:', choices: ['lab', 'evaluation', 'lecture', 'test', 'exercise'], default: 'lab' },
    { type: 'input', name: 'title', message: 'Title (optional):', default: '' },
    { type: 'input', name: 'description', message: 'Description (optional):', default: '' }
  ],
  serverlogs: [
    { type: 'input', name: 'timestamp', message: 'Timestamp (YYYY-MM-DD, optional):', default: '' },
    { type: 'input', name: 'user_id', message: 'User ID (optional):', default: '' },
    { type: 'input', name: 'action', message: 'Action:' },
    { type: 'input', name: 'details', message: 'Details (optional):', default: '' },
    { type: 'input', name: 'ip', message: 'IP (optional):', default: '' },
    { type: 'input', name: 'system_id', message: 'System ID (optional):', default: '' }
  ]
};

// Helper to normalize collection name (Mongo pluralization is inconsistent)
function normalizeCollectionName(name) {
  return name.toLowerCase().replace(/s$/, '').replace(/_/g, '') + (name.endsWith('s') ? '' : 's');
}

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
  const norm = normalizeCollectionName(collection);
  if (fieldPrompts[norm]) {
    data = await inquirer.prompt(fieldPrompts[norm]);
    // Special handling for some fields
    if (norm === 'courses' && data.parameters) {
      try { data.parameters = JSON.parse(data.parameters); } catch { data.parameters = {}; }
    }
    if (norm === 'tests') {
      if (data.questions) data.questions = data.questions.split(',').map(s => s.trim()).filter(Boolean);
      if (data.metadata) { try { data.metadata = JSON.parse(data.metadata); } catch { data.metadata = {}; } }
      data.envSettings = {
        allowTabSwitch: data.allowTabSwitch,
        allowExternalCopyPaste: data.allowExternalCopyPaste,
        allowInternalCopyPaste: data.allowInternalCopyPaste,
        enforceFullscreen: data.enforceFullscreen
      };
      delete data.allowTabSwitch; delete data.allowExternalCopyPaste; delete data.allowInternalCopyPaste; delete data.enforceFullscreen;
    }
    if (norm === 'questions') {
      if (data.tags) data.tags = data.tags.split(',').map(s => s.trim()).filter(Boolean);
      if (data.details) { try { data.details = JSON.parse(data.details); } catch { data.details = {}; } }
    }
    if (norm === 'questionpools' && data.questions) {
      data.questions = data.questions.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (norm === 'evaluations' && data.marksObtained === '') delete data.marksObtained;
    if (norm === 'labmanuals' && data.uploadDate === '') delete data.uploadDate;
    if (norm === 'facultycourses' && data.assignedDate === '') delete data.assignedDate;
    if (norm === 'schedules' && data.title === '') delete data.title;
    if (norm === 'schedules' && data.description === '') delete data.description;
    if (norm === 'serverlogs' && data.timestamp === '') delete data.timestamp;
    if (norm === 'serverlogs' && data.user_id === '') delete data.user_id;
    if (norm === 'serverlogs' && data.details === '') delete data.details;
    if (norm === 'serverlogs' && data.ip === '') delete data.ip;
    if (norm === 'serverlogs' && data.system_id === '') delete data.system_id;
  } else if (collection === 'users') {
    data = await inquirer.prompt(userFields);
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
  const norm = normalizeCollectionName(collection);
  if (fieldPrompts[norm]) {
    for (const field of fieldPrompts[norm]) {
      const { [field.name]: value } = await inquirer.prompt([
        { ...field, message: `Update ${field.message} (leave blank to skip):`, default: undefined }
      ]);
      if (value !== '') {
        if (norm === 'courses' && field.name === 'parameters') {
          try { data[field.name] = JSON.parse(value); } catch { data[field.name] = {}; }
        } else if (norm === 'tests' && field.name === 'questions') {
          data[field.name] = value.split(',').map(s => s.trim()).filter(Boolean);
        } else if (norm === 'tests' && field.name === 'metadata') {
          try { data[field.name] = JSON.parse(value); } catch { data[field.name] = {}; }
        } else if (norm === 'tests' && ['allowTabSwitch','allowExternalCopyPaste','allowInternalCopyPaste','enforceFullscreen'].includes(field.name)) {
          if (!data.envSettings) data.envSettings = {};
          data.envSettings[field.name] = value;
        } else if (norm === 'questions' && field.name === 'tags') {
          data[field.name] = value.split(',').map(s => s.trim()).filter(Boolean);
        } else if (norm === 'questions' && field.name === 'details') {
          try { data[field.name] = JSON.parse(value); } catch { data[field.name] = {}; }
        } else if (norm === 'questionpools' && field.name === 'questions') {
          data[field.name] = value.split(',').map(s => s.trim()).filter(Boolean);
        } else if (norm === 'evaluations' && field.name === 'marksObtained' && value === '') {
          // skip
        } else if (norm === 'labmanuals' && field.name === 'uploadDate' && value === '') {
          // skip
        } else if (norm === 'facultycourses' && field.name === 'assignedDate' && value === '') {
          // skip
        } else if (norm === 'schedules' && (field.name === 'title' || field.name === 'description') && value === '') {
          // skip
        } else if (norm === 'serverlogs' && ['timestamp','user_id','details','ip','system_id'].includes(field.name) && value === '') {
          // skip
        } else {
          data[field.name] = value;
        }
      }
    }
    Object.keys(data).forEach(k => { if (data[k] === '') delete data[k]; });
  } else if (collection === 'users') {
    for (const field of userFields) {
      const { [field.name]: value } = await inquirer.prompt([
        { ...field, message: `Update ${field.message} (leave blank to skip):`, default: undefined }
      ]);
      if (value !== '') {
        if (field.name === 'password') {
          const salt = await bcrypt.genSalt(10);
          data[field.name] = await bcrypt.hash(value, salt);
        } else {
          data[field.name] = value;
        }
      }
    }
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

async function clearUserSessionToken() {
  const users = await mongoose.connection.db.collection('users').find({}).toArray();
  if (users.length === 0) {
    console.log('No users found.');
    return;
  }
  const choices = users.map(u => ({
    name: `${u.name} (${u.user_id}, ${u.role}) [${u._id}]`,
    value: u._id.toString()
  }));
  const { id } = await inquirer.prompt([
    { type: 'list', name: 'id', message: 'Select user to clear session token:', choices }
  ]);
  const { ObjectId } = require('mongodb');
  const result = await mongoose.connection.db.collection('users').updateOne(
    { _id: new ObjectId(id) },
    { $set: { session_token: null } }
  );
  if (result.modifiedCount === 1) {
    console.log('Session token cleared.');
  } else {
    console.log('No changes made.');
  }
}

async function deleteDocument(collection) {
  if (collection === 'users') {
    const docs = await mongoose.connection.db.collection('users').find({}).toArray();
    if (docs.length === 0) {
      console.log('No users to delete.');
      return;
    }

    const { deleteType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'deleteType',
        message: 'How would you like to delete?',
        choices: ['Single User', 'Multiple Users', 'By Role']
      }
    ]);

    if (deleteType === 'Single User') {
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
    } 
    else if (deleteType === 'Multiple Users') {
      const choices = docs.map(doc => ({
        name: `${doc.name} (${doc.user_id}, ${doc.role}) [${doc._id}]`,
        value: doc._id.toString()
      }));
      const { ids } = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'ids',
          message: 'Select users to delete (use space to select multiple):',
          choices
        }
      ]);
      if (ids.length === 0) {
        console.log('No users selected.');
        return;
      }
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Are you sure you want to delete ${ids.length} users?`,
          default: false
        }
      ]);
      if (!confirm) {
        console.log('Delete operation cancelled.');
        return;
      }
      try {
        const { ObjectId } = require('mongodb');
        const result = await mongoose.connection.db.collection('users')
          .deleteMany({ _id: { $in: ids.map(id => new ObjectId(id)) } });
        console.log('Deleted:', result.deletedCount);
      } catch (e) {
        console.error('Delete error:', e.message);
      }
    }
    else if (deleteType === 'By Role') {
      const { role } = await inquirer.prompt([
        {
          type: 'list',
          name: 'role',
          message: 'Select role to delete:',
          choices: ['student', 'faculty']
        }
      ]);
      const usersToDelete = docs.filter(doc => doc.role === role);
      if (usersToDelete.length === 0) {
        console.log(`No users found with role: ${role}`);
        return;
      }
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Are you sure you want to delete all ${usersToDelete.length} ${role}s?`,
          default: false
        }
      ]);
      if (!confirm) {
        console.log('Delete operation cancelled.');
        return;
      }
      try {
        const result = await mongoose.connection.db.collection('users')
          .deleteMany({ role });
        console.log('Deleted:', result.deletedCount);
      } catch (e) {
        console.error('Delete error:', e.message);
      }
    }
  }
}

async function clearAllCollections() {
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    try {
      await collection.deleteMany({});
      console.log(`Cleared collection: ${collection.collectionName}`);
    } catch (err) {
      console.error(`Failed to clear collection ${collection.collectionName}:`, err);
    }
  }
  console.log('All collections cleared.');
}

async function mainMenu() {
  while (true) {
    const { action } = await inquirer.prompt({
      type: 'list',
      name: 'action',
      message: 'Choose action:',
      choices: [
        'List collections',
        'List documents',
        'Create document',
        'Update document',
        'Delete document',
        'Clear user session token',
        'Clear ALL collections (delete all data)',
        'Exit'
      ]
    });

    if (action === 'Exit') break;

    if (action === 'List collections') {
      const collections = await getCollections();
      console.log('\nCollections:', collections.join(', '));
    } else if (action === 'Clear ALL collections (delete all data)') {
      const { confirm } = await inquirer.prompt({
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to delete ALL documents in ALL collections? This cannot be undone.',
        default: false
      });
      if (confirm) {
        await clearAllCollections();
      } else {
        console.log('Aborted.');
      }
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
      } else if (action === 'Clear user session token') {
        await clearUserSessionToken();
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