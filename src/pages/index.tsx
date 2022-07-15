import type { NextPage } from "next";
import React from "react";
import randomWords from "random-words";
import { Canvas, useFrame, Vector3 } from "@react-three/fiber";
import {
  Center,
  Float,
  OrthographicCamera,
  Plane,
  Text3D,
} from "@react-three/drei";
import { Mesh, MeshBasicMaterial, WireframeGeometry } from "three";
import { Debug, Physics, Triplet, useBox, usePlane } from "@react-three/cannon";
import { folder, useControls } from "leva";

const sizes = {
  height: 800,
  width: 600,
};

const aspectRatio = sizes.width / sizes.height;
interface Word {
  text: string;
}

interface ActiveWord extends Word {
  nextChar: string;
  nextCharIndex: number;
}

let missSound: HTMLAudioElement | undefined,
  wordCompleteSound: HTMLAudioElement | undefined,
  undoSound: HTMLAudioElement | undefined;

// this errors on server-side
try {
  missSound = new Audio("miss.wav");
  wordCompleteSound = new Audio("word-complete.wav");
  undoSound = new Audio("undo.wav");
} catch (e) {}
function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
const ALPHAKEYS = "abcdefghjiklmnopqrstuvwxyz";

const Word = ({ text, ...props }: { text: string; completedIndex: number }) => {
  const [textRef, textApi] = useBox(() => ({
    mass: randomBetween(0.1, 20),
    position: props.position ?? [randomBetween(-10, 10), 25, 5],
  }));

  return (
    <>
      <Text3D
        castShadow
        scale={1}
        ref={textRef}
        size={1}
        font={"/Hack_Regular.json"}
        bevelEnabled
        bevelSize={0.05}
        bevelSegments={4}
        {...props}
      >
        <meshNormalMaterial />
        {text.slice(props.completedIndex).padStart(text.length, " ")}
      </Text3D>
    </>
  );
};

interface FloorProps {
  onCollide: () => void;
}
const Floor = ({ onCollide }: FloorProps) => {
  const [ref, planeApi] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    onCollide,
  }));
  return (
    <Plane receiveShadow args={[100, 100]}>
      <meshBasicMaterial color="lightblue" />
    </Plane>
  );
};

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
    wordCompleteSound?.play();
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
        undoSound?.play();
      }
      if (!ALPHAKEYS.includes(e.key)) return;
      const char = e.key;
      if (activeWord) {
        if (char !== activeWord.text[activeWord.nextCharIndex]) {
          missSound?.play();
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
          missSound?.play();
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
      containerHeight: `${sizes.height}px`,
      containerWidth: `${sizes.width}px`,
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
        <ambientLight />
        <Game />
        <axesHelper args={[3]} />
      </Canvas>
    </div>
  );
};
export default Home;
