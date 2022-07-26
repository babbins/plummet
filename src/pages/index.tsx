import { Debug, Physics } from "@react-three/cannon";
import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Floor } from "components/Floor";
import { Word } from "components/Word";
import { folder, useControls } from "leva";
import type { NextPage } from "next";
import randomWords from "random-words";
import React from "react";
import * as audio from "utils/audio";
import { randomBetween } from "utils/random-between";

const sizes = {
  height: "100%",
  width: "100%",
};
interface Word {
  text: string;
}

interface ActiveWord extends Word {
  nextChar: string;
  nextCharIndex: number;
}

const ALPHAKEYS = "abcdefghjiklmnopqrstuvwxyz";

const Game = () => {
  const [isGameOver, setIsGameOver] = React.useState<boolean>(false);
  const [activeWord, setActiveWord] = React.useState<ActiveWord | null>(null);
  const [wordMap, setWordMap] = React.useState<Map<string, { text: string }>>(
    () => new Map()
  );

  const addWord = React.useCallback(() => {
    const [word] = randomWords({ maxLength: 8, exactly: 1 });
    const firstLetter = word![0]!;

    if (wordMap.size === 25) return;

    if (wordMap.has(firstLetter)) {
      addWord();
      return;
    }

    setWordMap((prev) => {
      const newWordMap = new Map(prev);
      newWordMap.set(firstLetter, { text: word! });
      console.log(newWordMap);
      return newWordMap;
    });
  }, [wordMap]);

  const onCompleteActiveWord = React.useCallback(() => {
    if (!activeWord) {
      console.error("Tried called onCompleteActiveWord without an active word");
    }
    setWordMap((prev) => {
      const newWordMap = new Map(prev);
      newWordMap.delete(activeWord!.text[0] as string);
      console.log(newWordMap);
      return newWordMap;
    });

    setActiveWord(null);
    audio.wordComplete?.play();
  }, [activeWord]);

  React.useEffect(() => {
    if (isGameOver) return;
    const timeout = setTimeout(addWord, randomBetween(400, 1500));
    return () => clearTimeout(timeout);
  }, [addWord, isGameOver]);

  React.useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      const SPACE = " ";
      if (activeWord && e.key === SPACE) {
        setActiveWord(null);
        audio.undo?.play();
      }
      if (!ALPHAKEYS.includes(e.key)) return;
      const char = e.key;
      if (activeWord) {
        if (char !== activeWord.text[activeWord.nextCharIndex]) {
          audio.miss?.play();
          return;
        }

        const nextCharIndex = activeWord.nextCharIndex + 1;
        const nextChar = activeWord.text[nextCharIndex];
        if (!nextChar) {
          onCompleteActiveWord();
        } else {
          setActiveWord({ ...activeWord, nextCharIndex, nextChar });
        }
      } else {
        const targetWord = wordMap.get(char);
        if (!targetWord) {
          audio.miss?.play();
          return;
        }
        if (targetWord.text.length > 1) {
          setActiveWord({
            ...targetWord,
            nextChar: targetWord.text[1]!,
            nextCharIndex: 1,
          });
        }
      }
    };
    document.addEventListener("keydown", listener);
    return () => {
      document.removeEventListener("keydown", listener);
    };
  }, [activeWord, wordMap, onCompleteActiveWord]);

  useFrame((state) => {
    state.camera.updateProjectionMatrix();
  });
  const restartGame = () => {
    setIsGameOver(false);
    setWordMap(new Map());
    setActiveWord(null);
  };
  return (
    <React.Suspense fallback={null}>
      <Physics gravity={[0, -1, 0]}>
        <Debug color="black" scale={1.1}>
          {Array.from(wordMap.values()).map(({ text }) => {
            return activeWord?.text === text ? (
              <Word
                key={text}
                text={text}
                completedIndex={activeWord?.nextCharIndex}
              />
            ) : (
              <Word key={text} text={text} />
            );
          })}
          {isGameOver && (
            <Word
              text={"Game Over! :("}
              scale={1.2}
              position={[0, 15, 0]}
              onClick={restartGame}
            />
          )}
          <Floor onCollide={() => setIsGameOver(true)} />
        </Debug>
      </Physics>
    </React.Suspense>
  );
};

const Home: NextPage = () => {
  const controls = useControls({
    camera: folder({
      cameraPosition: [1, 10, 25],
      fov: 80,
    }),
    canvasShadows: true,
    dimensions: folder({
      containerHeight: `${sizes.height}`,
      containerWidth: `${sizes.width}`,
    }),
    light: folder({
      lightPosition: [10, 10, 10],
      castShadow: true,
      ["shadow-mapSize"]: [2048, 2048],
    }),
  });

  return (
    <div
      style={{
        height: controls.containerHeight,
        width: controls.containerWidth,
      }}
    >
      <Canvas
        camera={{
          position: controls.cameraPosition,
          fov: controls.fov,
          rotation: [0, 0, 0],
          // isOrthographicCamera: true,
        }}
        shadows={controls.canvasShadows}
      >
        {/* <OrthographicCamera
          makeDefault
          args={[-1 * aspectRatio, 1 * aspectRatio, 1, -1, 0.1, 1000]}
        /> */}
        <directionalLight
          position={controls.lightPosition}
          castShadow={controls.castShadow}
          shadow-mapSize={controls["shadow-mapSize"]}
        />
        <OrbitControls />
        <ambientLight />
        <Game />
        <axesHelper args={[3]} />
      </Canvas>
    </div>
  );
};

export default Home;
