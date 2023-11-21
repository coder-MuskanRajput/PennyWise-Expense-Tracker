const mongoose = require('mongoose');

const expenseModel = new mongoose.Schema({
  tags:String,
  amount: Number,
  category: String,
  text: String,
  date: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
},{
  timestamps:true
});

module.exports = mongoose.model('Expense', expenseModel);