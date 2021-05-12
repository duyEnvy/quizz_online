
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();

const DATABASE_NAME = 'onlinequizz';
const MONGO_URL = `mongodb://localhost:27017/${DATABASE_NAME}`;
let db = null;
let collectionQue = null;
async function startServer() {
    const client = await MongoClient.connect(MONGO_URL);
    db = client.db();
    collectionQue = db.collection("questions");
    collectionAtt = db.collection("attempts");
    console.log('database connected');
}
startServer();
// serve static files (html, css, js, images...)
app.use(express.static('public'));
// decode req.body from form-data
app.use(express.urlencoded());
// decode req.body from post body message
app.use(express.json());
// const answers = [
//   "1232",
//   "22322",
//   "232",
//   "1423222"
// ];
// const text = "232+2323*0 =?";
// async function createQue(){
//   await collectionQue.insertOne({answers:answers,text:text, correctAnswer:2,__v:0});
//   const results = await collectionQue.find({}).toArray();
//   console.log(results);
// }


//this work but not so well,idk why if i click many answers and refresh the quizz,the console said that it failed to fetch,click a few answer may work fine
app.patch('/attempts/:id',async function (req, res){
  const attID = req.params.id;
  const userOptions = req.body.answers;
  console.log(userOptions);
  await collectionAtt.updateOne(
    { _id: ObjectId(attID)},
    { $set:{answers: userOptions} }
    );
});

app.post('/attempts',async function (req, res){
  
  const questionsArr = await collectionQue.aggregate( [ { $sample: {size: 10} } ] ).toArray();
  const startedAt = Date();
  const correctAnswersObj = {};
        for(question of questionsArr){
          correctAnswersObj[question._id] = question.correctAnswer;
          delete  question.correctAnswer;
        }
  await collectionAtt.insertOne({questions:questionsArr,correctAnswers:correctAnswersObj,startedAt:startedAt,completed:false,__v:0});
  const lastestAttempt = await collectionAtt.find().sort({'_id':-1}).limit(1).toArray();
  const returnObj = {_id:lastestAttempt[0]._id,questions:questionsArr,score:0,startedAt:startedAt,completed:false,__v:0};
  res.json(returnObj);
});

app.get('/attempts/:id',async function (req, res){
  const attID = req.params.id;
  await collectionAtt.findOne({ _id: ObjectId(attID)}, function(err, attempt) {
    const questionsArr = attempt.questions;
    for (question of questionsArr){
      delete  question.correctAnswer;
    }
    returnSubmitObj= {_id:attempt._id,questions:questionsArr,score:0,answers:attempt.answers,startedAt:attempt.startedAt,completed:false,__v:0};
    res.json(returnSubmitObj);
  });
});

app.post('/attempts/:id/submit',async function (req, res){
  const attID = req.params.id;
  const userOptions = req.body.answers;
  let count = 0;
  let returnSubmitObj={};
  let scoreText = "";
  let startedAt = 0;
  await collectionAtt.findOne({ _id: ObjectId(attID)}, function(err, attempt) {
    startedAt = attempt.startedAt;
    for(option in userOptions){
      if(attempt.correctAnswers[option] == userOptions[option]){
        count++;
      }
    }
    switch(true){
      case (count<5):
        scoreText = "Practice more to improve it :D";
        break;
      case (count>=5 && count<7):
        scoreText = "Good, keep up!";
        break;
      case (count>=7 && count<9):
        scoreText = "Well done!";
        break;
      case (count>=9 && count<=10):
        scoreText = "Perfect!!";
        break;
      default:
        scoreText = "undefined";
        break;
    }
    returnSubmitObj= {_id:attempt._id,questions:attempt.questions,answers:userOptions,correctAnswers:attempt.correctAnswers,score:count,startedAt:startedAt,completed:true,__v:0,scoreText:scoreText};
    res.json(returnSubmitObj);
  });
  
  
});



app.listen(3000, function(){
    console.log('Listening on port 3000!');
});



