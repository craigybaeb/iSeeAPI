
// For now we will only define the required and main attributes of iSee Onto

const mongoose = require('mongoose');

// Duplicated on persona.js file 
const personaSchema = new mongoose.Schema({
    details: {
        type: Object
    },
    completed: {
        type: Boolean
    },
    intents: {
        type: Array
    }
}, { strict: false, timestamps: true });

// const intentSchema = new mongoose.Schema({
//     completed: {
//         type: Boolean
//     },
//     strategies
// }, { strict: false, timestamps: true });

const usecaseSchema = new mongoose.Schema({
    name: {
        required: true,
        type: String
    },
    goal: {
        type: String
    },
    domain: {
        type: Array
    },
    status: {
        type: String
    },
    settings: {
        type: Object
    },
    stats: {
        type: Object
    },
    published: {
        type: Boolean
    },
    personas: {
        type: [personaSchema]
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    version: {
        type: Number
    },
    invites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UsecaseInvite'
    }],
    interactions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Interaction'
    }],
    endusers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
}, {
    strict: false,
    timestamps: true,
    toJSON: { virtuals: true }, toObject: {virtuals: true}

})

module.exports = mongoose.model('Usecase', usecaseSchema)