import React, { useEffect, useState } from 'react';
import './App.css';
import io from 'socket.io-client';
import 'react-toastify/dist/ReactToastify.css';
import useSound from 'use-sound';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faUser } from '@fortawesome/free-solid-svg-icons';
import reloj from './assets/sonido/reloj.mp3';

const socket = io('ws://localhost:5000');

function App() {
  const [name, setName] = useState<string>('');
  const [room, setRoom] = useState<string>('');
  const [info, setInfo] = useState<boolean>(false);
  const [question, setQuestion] = useState<string>('');
  const [options, setOptions] = useState<string[]>([]);
  const [seconds, setSeconds] = useState<number | undefined>(undefined);
  const [scores, setScores] = useState<any[]>([]);
  const [winner, setWinner] = useState<string | undefined>(undefined);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [answered, setAnswered] = useState<boolean>(false);
  const [joinMessage, setJoinMessage] = useState<string>('');
  const [gameMode, setGameMode] = useState<string | null>(null);
  const [imagen, setImagen] = useState<string>('');
  const [playersAndScores, setPlayersAndScores] = useState<JSX.Element[]>([]);
  const [playSound] = useSound(reloj);
  const [level, setLevel] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [answerFeedback, setAnswerFeedback] = useState<string>('');

  const handleModeClick = (mode: string) => {
    setGameMode(mode);
    if (mode === 'solo') {
      setInfo(true);
      socket.emit('getQuestions');
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (name && room) {
      setInfo(true);
      if (gameMode === 'solo') {
        socket.emit('getQuestions', room);
      }
    }
  };

  const handleAnswer = (answerIndex: number) => {
    if (!answered) {
      setSelectedAnswerIndex(answerIndex);
      socket.emit('submitAnswer', room, answerIndex);
      setAnswered(true);
    }
  };

  useEffect(() => {
    if (seconds === 0) return;

    const timerInterval = setInterval(() => {
      setSeconds((prevTime) => (prevTime ? prevTime - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(timerInterval);
    };
  }, [seconds]);

  useEffect(() => {
    if (name) {
      socket.emit('joinRoom', room, name);
    }
  }, [info]);

  useEffect(() => {
    socket.on('message', (message) => {
      setJoinMessage(`${message} !!`);
      setTimeout(() => {
        setJoinMessage('');
      }, 3000);
    });

    return () => {
      socket.off('message');
    };
  }, []);

  useEffect(() => {
    socket.on('newQuestion', (data) => {
      setQuestion(data.question);
      setOptions(data.answers);
      setAnswered(false);
      setSeconds(data.timer);
      setSelectedAnswerIndex(null);
      setImagen(data.imagen);
      setLevel(data.level);
      setCategory(data.category);
    });

    socket.on('answerResult', (data) => {
      setIsAnswerCorrect(data.isCorrect);

      if (data.isCorrect) {
        setAnswerFeedback(`¡Correcto! ${data.playerName} lo ha acertado.`);
      } else {
        setAnswerFeedback(`¡Incorrecto! ${data.playerName} ha fallado.`);
      }

      setTimeout(() => {
        setIsAnswerCorrect(null);
        setAnswerFeedback('');
      }, 3000);

      setScores(data.scores);
    });

    socket.on('gameOver', (data) => {
      setWinner(data.winner);
      const playersAndScores = data.players.map((player: any) => (
        <p key={player.id}>
          {player.name}: {player.score} /5
        </p>
      ));
      setPlayersAndScores(playersAndScores);
    });

    return () => {
      socket.off('newQuestion');
      socket.off('answerResult');
      socket.off('gameOver');
    };
  }, []);

  const handleRestart = () => {
    setWinner(undefined);
    setQuestion('');
    setOptions([]);
    setScores([]);
    setSeconds(0);
    setSelectedAnswerIndex(null);
    setAnswered(false);
    setJoinMessage('');
    setInfo(false);
    setGameMode(null);
    setName('');
    setRoom('');
  };

  const handleJoinClick = () => {
    playSound();
  };

  if (winner) {
    return (
      <div className="winner-container">
        <h1>{winner} Ha Ganado.</h1>
        <button onClick={handleRestart}>Volver al Inicio</button>

        {playersAndScores && (
          <div className="scores-container">
            <h2>Tabla de puntajes</h2>
            {scores.map((player, index) => (
              <p key={index}>
                {player.name}: {player.score}
              </p>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="App">
      {!gameMode ? (
        <div className="welcome-div">
          <h2>Bienvenidos <br /> a</h2>
          <h1>Play Quiz</h1>
          <p>Selecciona un modo de juego:</p>
          <div>
            <button onClick={() => handleModeClick('solo')}>Solitario</button>
            <button onClick={() => handleModeClick('multijugador')}>Multijugador</button>
          </div>
        </div>
      ) : (
        !info ? (
          <div className="join-div">
            <h1>Play Quiz!</h1>
            <form onSubmit={handleSubmit}>
              <input id="name" type="text" required placeholder="Ingresa tu nombre" value={name} onChange={(e) => setName(e.target.value)} />
              <input id="room" type="text" required placeholder="Ingresa el nombre de la sala" value={room} onChange={(e) => setRoom(e.target.value)} />
              <button className="join-btn" type="submit" onClick={handleJoinClick}>Unirse</button>
            </form>
          </div>
        ) : (
          <div>
            <h1>PLAY QUIZ</h1>
            <p className="room-id">Id Sala: {room}</p>
            {question ? (
              <div className="quiz-div">
                <div className="timer">
                  <p>00:{seconds && seconds < 10 ? `0${seconds}` : seconds} <FontAwesomeIcon icon={faClock} /></p>
                  <p>Categoría: {category} ㅤㅤㅤㅤNivel: {level}</p>
                </div>
                <div className="question">
                  <p className="question-text">{question}</p>
                </div>
                {imagen && (
                  <div className="image-container">
                    <img src={imagen} alt="Imagen de la pregunta" />
                  </div>
                )}
                <ul>
                  {options.map((answer, index) => (
                    <li key={index}>
                      <button className={`options ${selectedAnswerIndex === index ? 'selected' : ''}`} onClick={() => handleAnswer(index)} disabled={answered}>
                        {answer}
                      </button>
                    </li>
                  ))}
                </ul>
                {isAnswerCorrect !== null && (
                  <div className={`answer-feedback ${isAnswerCorrect ? 'correct' : 'incorrect'}`}>
                    {answerFeedback}
                  </div>
                )}
                {scores.map((player, index) => (
                  <p key={index}>
                    <FontAwesomeIcon icon={faUser} /> {player.name}: {player.score} /5
                  </p>
                ))}
                <h3>Objetivo: <br /> Responder 5 preguntas en el menor tiempo posible.</h3>
              </div>
            ) : (
              <p>Cargando las Preguntas....</p>
            )}
          </div>
        )
      )}
      {joinMessage && (
        <div className="join-message-container">
          <p className="join-message">{joinMessage}</p>
        </div>
      )}
    </div>
  );
}

export default App;
