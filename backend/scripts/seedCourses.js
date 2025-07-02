const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Course = require('../models/Course');

dotenv.config();

const labCourses = [
  { code: "cs23c04", name: "Programming in C" },
  { code: "cs23101", name: "Computational Thinking" },
  { code: "me23c01", name: "Engineering Drawing and 3D Modelling" },
  { code: "me23c04", name: "Makerspace" },
  { code: "cs23201", name: "Object Oriented Programming" },
  { code: "cs23302", name: "Data Structures" },
  { code: "cs23303", name: "Digital System Design" },
  { code: "cs23304", name: "Java Programming" },
  { code: "cs23401", name: "Database Management Systems" },
  { code: "cs23402", name: "Computer Architecture" },
  { code: "cs23403", name: "Full Stack Technologies" },
  { code: "cs23501", name: "Operating Systems" },
  { code: "cs23502", name: "Networks and Data Communication" },
  { code: "cs23601", name: "Cryptography and System Security" },
  { code: "cs23602", name: "Compiler Design" },
  { code: "cs23603", name: "Machine Learning" },
  { code: "cs23604", name: "Creative and Innovative Project" },
  { code: "cs23801", name: "Project Work / Internship" }
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  for (const course of labCourses) {
    // Upsert: update if exists, insert if not
    await Course.updateOne(
      { code: course.code },
      { $set: { name: course.name, code: course.code } },
      { upsert: true }
    );
    console.log(`Upserted: ${course.code} - ${course.name}`);
  }
  await mongoose.disconnect();
  console.log('Seeding complete.');
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
