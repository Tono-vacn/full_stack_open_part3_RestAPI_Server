require('dotenv').config()
const express = require('express')
const app = express()
const morgan = require('morgan')
const cors = require('cors')

// DO NOT SAVE YOUR PASSWORD TO GITHUB!!

// const mongoose = require('mongoose')

// if (process.argv.length < 3) {
//   console.log('Please provide the password as an argument: node mongo.js <password>')
//   process.exit(1)
// }

// const password = process.argv[2]

// const url =
//   `mongodb+srv://jycforwork4:Jyc100206461@cluster0.dazwln2.mongodb.net/retryWrites=true&w=majority`

// mongoose.connect(url)

// const personSchema = new mongoose.Schema({
//     id: Number,
//     name: String,
//     number: String,
// })

// personSchema.set('toJSON', {
//     transform: (document, returnedObject) => {
//         returnedObject.id = returnedObject._id.toString()
//         delete returnedObject._id
//         delete returnedObject.__v
//     }
// })

// const Person = mongoose.model('Person', personSchema)

const Person = require('./models/person')

const requestLogger = (request, response, next) => {
  console.log('Method:', request.method)
  console.log('Path:  ', request.path)
  console.log('Body:  ', request.body)
  console.log('---')
  next()
}

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  }
  else if (error.name === 'ValidationError'){
    return response.status(400).send({ error: error.message })
  }
  else if(error.name === 'MongoError'){
    return response.status(400).send({ error: error.message })
  }
  else if(error.name === 'TypeError'){
    return response.status(400).send({ error: error.message })
  }

  next(error)
}

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}


morgan.token('body', function (req, res) {
  if(req.method === 'POST'){
    return JSON.stringify(req.body)
  }})




app.use(express.json())
app.use(requestLogger)
app.use(express.static('build'))
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))
app.use(cors())

// let persons = [
//     {
//       "id": 1,
//       "name": "Arto Hellas",
//       "number": "040-123456"
//     },
//     {
//       "id": 2,
//       "name": "Ada Lovelace",
//       "number": "39-44-5323523"
//     },
//     {
//       "id": 3,
//       "name": "Dan Abramov",
//       "number": "12-43-234345"
//     },
//     {
//       "id": 4,
//       "name": "Mary Poppendieck",
//       "number": "39-23-6423122"
//     }
// ]
app.get('/', (request, response) => {
  response.send('<h1>Hello World!</h1>')
})

app.get('/api/persons', (request, response) => {
  // response.json(persons)
  Person.find({}).then(result => {response.json(result)})
})

app.get('/api/persons/:id', (request, response,next) => {
  // const id = Number(request.params.id)
  // const person = persons.find(p => p.id === id)
  // if (person){
  //     response.json(person)
  // }else{
  //     response.status(404).end()
  // }
  Person.findById(request.params.id).then(person => {
    if(person){
      response.json(person)
    }else{
      response.status(404).end()
    }
  }).catch(error => next(error))
  //console.log(error)
})

app.get('/info', (request, response,next) => {
  Person.countDocuments({}).then(result => {response.send(`<p>Phonebook has info for ${result} people</p>
  <p>${new Date()}</p>`)}).catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response,next) => {
  // const id = Number(request.params.id)
  Person.findByIdAndRemove(request.params.id)
    .then(result => {
      response.status(204).end()
    })
    .catch(error => next(error))
})

// const generateId = () => {
//   // const maxId = persons.length > 0
//   //   ? Math.max(...persons.map(n => n.id))
//   //   : 0
//   const random = Math.floor(Math.random() * 1000000)
//   if (Person.find(p => p.id === random)){
//       return generateId()
//   }
//   return random
//   // return maxId + 1
// }

app.post('/api/persons', (request, response,next) => {
  const body = request.body
  // if (!body.name) {
  //   return response.status(400).json({
  //     error: 'Name required'
  //   })
  // }

  Person.findOne({name: body.name}).then(result => {
    if (result){
      return response.status(400).json({
        error: 'name must be unique'
      })
    }
    else{
      const person = new Person({
        name: body.name,
        number: body.number,
        // id: generateId(),
      })
      person.save().then(savedperson => {response.json(savedperson)}).catch(error => next(error))
    }
  }).catch(error => next(error))
  // else if (Person.find(p => p.name === body.name)){
  //     return response.status(400).json({
  //         error: 'name must be unique'
  //       })
  // }

  // const person = new Person({
  //   name: body.name,
  //   number: body.number,
  //   // id: generateId(),
  // })
  // const person = {
  //   name: body.name,
  //     number: body.number,

  // //   important: body.important || false,
  // //   date: new Date(),
  //   id: generateId(),
  // }

  // persons = persons.concat(person)

  // response.json(person)

  // person.save().then(savedperson=>{
  //   response.json(savedperson)
  // })
})

app.put('/api/persons/:id', (request, response,next) => {
  const body = request.body
  const person = {
    name: body.name,
    number: body.number,
  }

  Person.findByIdAndUpdate(request.params.id, person, { new: true, runValidators: true, context: 'query' })
    .then(updatedPerson => {
      response.json(updatedPerson)
    })
    .catch(error => next(error))
})


app.use(unknownEndpoint)
app.use(errorHandler)//has to be the last loaded middleware


const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})