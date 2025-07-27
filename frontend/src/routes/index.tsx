import { createFileRoute, Link } from '@tanstack/react-router';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { Canvas, useThree } from "@react-three/fiber"
import { OrbitControls, Environment } from "@react-three/drei"
import { useRef, useState, useEffect } from "react"
import * as THREE from "three"
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: LandingPage,
});

const isMobile = () => {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

const BoxWithEdges = ({ position }: { position: [number, number, number] }) => {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshPhysicalMaterial 
          color="#0070f3"
          roughness={0.1}
          metalness={0.8}
          transparent={true}
          opacity={0.9}
          transmission={0.5}
          clearcoat={1}
        />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(0.5, 0.5, 0.5)]} />
        <lineBasicMaterial color="#214dbd" linewidth={2} />
      </lineSegments>
    </group>
  )
}

const BoxLetter = ({ letter, position }: { letter: string, position: [number, number, number] }) => {
  const group = useRef<THREE.Group>(null)

  const getLetterShape = (letter: string) => {
    const shapes = {
      N: [
        [1,0,0,0,1],
        [1,1,0,0,1],
        [1,0,1,0,1],
        [1,0,0,1,1],
        [1,0,0,0,1],
      ],
      E: [
        [1,1,1],
        [1,0,0],
        [1,1,0],
        [1,0,0],
        [1,1,1],
      ],
      X: [
        [1,0,0,0,1],
        [0,1,0,1,0],
        [0,0,1,0,0],
        [0,1,0,1,0],
        [1,0,0,0,1],
      ],
      T: [
        [1,1,1],
        [0,1,0],
        [0,1,0],
        [0,1,0],
        [0,1,0],
      ],
    }
    return shapes[letter as keyof typeof shapes] || shapes['N'] // Default to 'N' if letter is not found
  }

  const letterShape = getLetterShape(letter)

  return (
    <group ref={group} position={position}>
      {letterShape.map((row: number[], i: number) =>
        row.map((cell: number, j: number) => {
          if (cell) {
            let xOffset = j * 0.5 - (letter === 'T' ? 1 : letter === 'E' ? 0.5 : letter === 'X' || letter === 'N' ? 1 : 0.75)
            
            if (letter === 'N') {
              if (j === 0) {
                xOffset = -0.5;
              } else if (j === 1) {
                xOffset = 0;
              } else if (j === 2) {
                xOffset = 0.25;
              } else if (j === 3) {
                xOffset = 0.5;
              } else if (j === 4) {
                xOffset = 1;
              }
            }
            
            if (letter === 'X') {
              if (j === 0) {
                xOffset = -1;
              } else if (j === 1) {
                xOffset = -0.75;
              } else if (j === 2) {
                xOffset = -0.25;
              } else if (j === 3) {
                xOffset = 0.25;
              } else if (j === 4) {
                xOffset = 0.5;
              }
            }
            
            return (
              <BoxWithEdges 
                key={`${i}-${j}`} 
                position={[xOffset, (4 - i) * 0.5 - 1, 0]}
              />
            )
          }
          return null
        })
      )}
    </group>
  )
}

const ClickableTextGroup = () => {
  const [isHovered, setIsHovered] = useState(false)
  const navigate = useNavigate()
  const { user } = useFirebaseAuth();
  
  const handleClick = () => {
    // Navigate to your desired route
    navigate({ to: user ? "/projects" : "/login" }) // Change this to your desired route
  }

  return (
    <group 
      position={[-0.5, 0, 0]} 
      rotation={[0, Math.PI / 1.5, 0]}
      onPointerOver={() => setIsHovered(true)}
      onPointerOut={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Invisible sphere for hover detection */}
      <mesh>
        <sphereGeometry args={[4, 32, 32]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      {/* Visible sphere that appears on hover */}
      {isHovered && (
        <mesh>
          <sphereGeometry args={[4, 32, 32]} />
          <meshPhysicalMaterial 
            color="#0070f3"
            transparent={true}
            opacity={0.5}
            wireframe={true}
            wireframeLinewidth={2}
          />
        </mesh>
      )}
      
      {/* Text letters */}
      <BoxLetter letter="N" position={[-3.75, 0, 0]} />
      <BoxLetter letter="E" position={[-1.25, 0, 0]} />
      <BoxLetter letter="X" position={[1.25, 0, 0]} />
      <BoxLetter letter="T" position={[3.75, 0, 0]} />
    </group>
  )
}

const Scene = () => {
  const orbitControlsRef = useRef<typeof OrbitControls | null>(null)
  const [isMobileDevice, setIsMobileDevice] = useState(false)

  useEffect(() => {
    setIsMobileDevice(isMobile())
  }, [])

  return (
    <>
      <ClickableTextGroup />
      <OrbitControls 
        ref={orbitControlsRef as React.RefObject<OrbitControls>}
        enableZoom
        enablePan
        enableRotate
        autoRotate={false}
        autoRotateSpeed={2}
      />
      
      <ambientLight intensity={0.5} />
      
      <directionalLight position={[5, 5, 5]} intensity={0.5} color="#ffffff" />
      
      <Environment 
        files={isMobileDevice 
          ? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/download3-7FArHVIJTFszlXm2045mQDPzsZqAyo.jpg"
          : "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/dither_it_M3_Drone_Shot_equirectangular-jpg_San_Francisco_Big_City_1287677938_12251179%20(1)-NY2qcmpjkyG6rDp1cPGIdX0bHk3hMR.jpg"
        }
        background
      />
    </>
  )
}

function LandingPage() {
  return (
    <div className="w-full h-screen bg-gray-900">
      <Canvas camera={{ position: [10.047021, -0.127436, -11.137374], fov: 70 }}>
        <Scene />
      </Canvas>
    </div>
  )
}