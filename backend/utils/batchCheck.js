const Batch = require('../models/Batch');

const ensureBatchesExist = async () => {
  try {
    // Check if batches already exist
    const count = await Batch.countDocuments();
    
    if (count < 3) { // We expect 3 batches
      console.log('Some batches missing, ensuring all exist...');
      
      // Only create batches that don't exist
      const batches = ['N', 'P', 'Q'];
      
      for (const batchName of batches) {
        await Batch.findOneAndUpdate(
          { name: batchName },
          { name: batchName },
          { upsert: true, new: true, runValidators: true }
        );
      }
      console.log('Batches verified/created');
    }
  } catch (error) {
    console.error('Error ensuring batches exist:', error);
  }
};

module.exports = ensureBatchesExist;