document.querySelector('.start-quiz-button').addEventListener('click', displayQuestion);

function clickRadio(){
  let selector =document.querySelectorAll('input:checked');
  let chosedanswerJSON =createJsonAnswer(selector);
  console.log(chosedanswerJSON);
  fetch('/attempts/' + String(attemptID), {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json'
  },
  body: chosedanswerJSON
}).catch((err) => {
  console.log(`Error: ${err}`)
});
}
function createQuizz(jsonResponse){
  attemptID = jsonResponse._id;
        let index = 0;
        //create question and answer containers
        for(element of jsonResponse.questions){
          
          let questionList = document.querySelector('#question-list');
          let queNum = document.createElement('h2');
          queNum.textContent = 'Question ' + (index + 1) + ' of 10';
          let que = document.createElement('p');
          que.textContent = element.text;
          questionList.appendChild(queNum);
          questionList.appendChild(que);
          let divAnswer = document.createElement('div');
          divAnswer.id = element._id;
          questionList.appendChild(divAnswer);
          let valueAns = 0;
          //create labels of answer and radio inputs for each answer container
          for (ans of element.answers) {
            let labelAnswer = document.createElement('label');
            labelAnswer.addEventListener('click', clickAnswer);
            let answerContent = document.createElement('span');
            answerContent.textContent = ans;
            labelAnswer.classList.add('choice');
            let radio = document.createElement('input');
            radio.addEventListener('click', clickRadio);
            radio.type = 'radio';
            radio.value = valueAns;
            radio.id = 'radio-id-' + valueAns;
            radio.name = 'question' + (index + 1);
            labelAnswer.appendChild(radio);
            labelAnswer.appendChild(answerContent);
            divAnswer.appendChild(labelAnswer);
            valueAns++;
          }
          index++;
        }
}

let attemptID;
//call the api to load question and answer
function displayQuestion() {
  document.querySelector('#description').style.display = 'none';
  document.querySelector('#question-list').style.display = 'block';
  document.querySelector('#submit').style.display = 'block';

  if (localStorage.getItem("attempt_ID") !== null) {
    fetch('/attempts/'+String(localStorage.attempt_ID), {
      method: 'GET'
    }).then((response) => {
      response.json().then((jsonResponse) => {
        
        createQuizz(jsonResponse);

        if(jsonResponse.answers){
          const keyNames = Object.keys(jsonResponse.answers);
          for (key of keyNames){
            const answerIndex = jsonResponse.answers[key];
            const queDiv = document.getElementById(key);
            queDiv.querySelector("#radio-id-"+answerIndex+"").checked = true;
            queDiv.querySelector("#radio-id-"+answerIndex+"").parentElement.classList.add('clicked');
            
          }
        }
        
      })
    }).catch((err) => {
      console.log(`Error: ${err}`)
    });
  }else {
  fetch('/attempts', {
    method: 'POST'
  }).then((response) => {
    response.json().then((jsonResponse) => {
      if (typeof(Storage) !== "undefined") {
        // Code for localStorage/sessionStorage.
        // Store
        localStorage.setItem("attempt_ID", jsonResponse._id);
      }
      createQuizz(jsonResponse);
      
    })
  }).catch((err) => {
    console.log(`Error: ${err}`)
  });
}}

async function clickAnswer(event) {
  
  

  const clickedAns = event.currentTarget;
  const parentE = clickedAns.parentElement;
  
  const clickedAns1 = parentE.querySelector('.clicked');
  if (clickedAns1 != null) {
    clickedAns1.classList.remove('clicked');
  }
  clickedAns.classList.add('clicked');
  
}




document.querySelector('#green-button').addEventListener('click', confirmSubmit);
function confirmSubmit() {
  if (confirm("Are you sure you want to submit ?")) {
    submitAnswer();
  } else {
  }
}


function createJsonAnswer(selector) {
  if (selector.length !=0) {
    let answerJSON = '{ "answers": {';
      for (let i = 0; i < selector.length; i++) {
        if (i == (selector.length - 1)) {
          answerJSON += '"' + selector[i].parentElement.parentElement.getAttribute('id') + '"' + ':' + selector[i].value + '}}';
          break;
        }
        answerJSON += '"' + selector[i].parentElement.parentElement.getAttribute('id') + '"' + ':' + selector[i].value + ',';
      }
      return answerJSON; 
  } else {
    let answerJSON = '{ "answers": {}}';
    return answerJSON;
  }
}


  function submitAnswer() {
  let selector = document.querySelectorAll('input:checked');
  let answerJSON = createJsonAnswer(selector);
  fetch('/attempts/' + String(attemptID) + '/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: answerJSON
  }).then((response) => {
    response.json().then((jsonResponse) => {
      if (typeof(Storage) !== "undefined") {
        // Code for localStorage/sessionStorage.
        localStorage.removeItem("attempt_ID");
      }
      //add review
      addContentReview(jsonResponse);

      //add color to user's correct answer
      highlightCorrectAnswer(jsonResponse.correctAnswers);

      //add color to user's wrong answer
      highlightWrongAnswer(selector);
    })
  //catch fetch error
  }).catch((err) => {
    console.log(`Error: ${err}`)
  });
  // disable input
  const listRadio = document.querySelectorAll('input');
  for (radio of listRadio) {
    radio.disabled = true;
  }
  //remove the function to change color when click
  const listLabel = document.querySelectorAll('label');
  for (label of listLabel) {
    label.removeEventListener('click', clickAnswer);
  }
  //hide the submit button
  const submit = document.querySelector('#submit');
  submit.style.display = "none";
  //show result
  const result = document.querySelector('#result');
  result.style.display = "block";
}


function addContentReview(jsonResponse) {
  document.querySelector('#score').textContent = jsonResponse.score + '/10';
  document.querySelector('#score-percent').textContent = jsonResponse.score * 10 + ' %';
  document.querySelector('#score-text').textContent = jsonResponse.scoreText;
}


function highlightCorrectAnswer (attemptCorrectAnswers) {
  for (const queId in attemptCorrectAnswers) {
    const que = document.getElementById(queId);
    const radioCorrectAns = que.querySelector('#radio-id-' + attemptCorrectAnswers[queId]);
    const correctAns = document.createElement('span');
    correctAns.textContent = 'Correct answer';
    correctAns.id = 'correct-answer';
    radioCorrectAns.parentElement.appendChild(correctAns);
    if(radioCorrectAns.parentElement.classList.contains("clicked")){
      radioCorrectAns.parentElement.classList.add('your-correct-answer');
    }else{
      radioCorrectAns.parentElement.classList.add('correct-answer');
    }
  }
}



function highlightWrongAnswer(selector) {
  for (let i = 0; i < selector.length; i++) {
    if (selector[i].parentElement.querySelector('#correct-answer') == null) {
      const yourAns = document.createElement('span');
      yourAns.textContent = 'Your answer';
      yourAns.id = 'your-answer';
      selector[i].parentElement.appendChild(yourAns);
      selector[i].parentElement.classList.add('wrong-answer');
    }
  }
}


//reload page
document.querySelector('.retry').addEventListener('click', retry);
function retry() {
  document.querySelector('#question-list').innerHTML = '';
  document.querySelector('#result').style.display = "none";
  document.querySelector('#description').style.display = 'block';
}
