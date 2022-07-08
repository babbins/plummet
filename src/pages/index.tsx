import type { NextPage } from "next";
import kaboom, { MoveComp, TextComp } from "kaboom";
import type { GameObj } from "kaboom";
import Head from "next/head";
import { trpc } from "../utils/trpc";
import React from "react";
import { string } from "zod";
import randomWords from "random-words";

interface Word {
  text: string;
  wordGameObj: GameObj<MoveComp>;
}

interface ActiveWord extends Word {
  nextChar: string;
  nextCharIndex: number;
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const Home: NextPage = () => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isGameOver, setIsGameOver] = React.useState<boolean>(false);
  const [activeWord, setActiveWord] = React.useState<ActiveWord | null>(null);
  const [wordMap, setWordMap] = React.useState<
    Map<string, { text: string; wordGameObj: GameObj }>
  >(() => new Map());
  console.log(wordMap);
  const addWord = React.useCallback(() => {
    const [word] = randomWords({ maxLength: 8, exactly: 1 });
    const firstLetter = word![0]!;

    if (wordMap.has(firstLetter)) {
      addWord();
      return;
    }

    const wordGameObj = add([
      "word",
      text(word!),
      pos(randomBetween(0, width()), 0),
      area(),
      solid(),
      scale(0.5),
      move(DOWN, randomBetween(50, 250)),
    ]);
    setWordMap((prev) => {
      const newWordMap = new Map(prev);
      newWordMap.set(firstLetter, { text: word!, wordGameObj });
      return newWordMap;
    });
  }, [wordMap]);

  React.useEffect(() => {
    canvasRef.current?.focus();

    kaboom({
      canvas: canvasRef.current || undefined,
      width: 500,
      height: 800,
    });

    const floor = add([
      rect(width(), 48),
      pos(0, height() - 48),
      outline(4),
      area(),
      solid(),
      color(127, 200, 255),
    ]);

    floor.onCollide("word", (a, b) => {
      a.destroy();
      setIsGameOver(true);
    });
  }, []);

  React.useEffect(() => {
    const timeout = setTimeout(addWord, randomBetween(800, 3000));
    return () => clearTimeout(timeout);
  }, [addWord]);
  React.useEffect(() => {
    const removeListener = onCharInput((char) => {
      if (activeWord?.nextChar === char) {
        const nextCharIndex = activeWord.nextCharIndex + 1;
        const nextChar = activeWord.text[nextCharIndex];
        if (!nextChar) {
          activeWord.wordGameObj.destroy();
          setActiveWord(null);
        } else {
          // activeWord.wordGameObjtransform((i) =>
          //   i < nextCharIndex ? RED : undefined
          // );
          setActiveWord({ ...activeWord, nextCharIndex, nextChar });
        }
      } else {
        const targetWord = wordMap.get(char);
        if (!targetWord) return;

        if (targetWord.text.length > 1) {
          setActiveWord({
            ...targetWord,
            nextChar: targetWord.text[1]!,
            nextCharIndex: 1,
          });
        }
      }
    });
    return removeListener;
  }, [activeWord, wordMap]);

  return (
    <div>
      <canvas ref={canvasRef}></canvas>
      {isGameOver && <h1>Game Over</h1>}
    </div>
  );
};

export default Home;
