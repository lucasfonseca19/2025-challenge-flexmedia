import Human, { type Config, type FaceResult } from '@vladmandic/human'

const humanConfig: Partial<Config> = {
  backend: 'webgl',
  modelBasePath: '/models/human',
  cacheSensitivity: 0.01,
  warmup: 'none',
  filter: {
    enabled: true,
    equalization: true,
    flip: false,
  },
  face: {
    enabled: true,
    detector: {
      rotation: true,
      maxDetected: 1,
      minConfidence: 0.4,
      minSize: 160,
      return: false,
    },
    mesh: { enabled: true },
    iris: { enabled: false },
    attention: { enabled: false },
    description: { enabled: true, minConfidence: 0.4 },
    emotion: { enabled: false },
    antispoof: { enabled: false },
    liveness: { enabled: false },
  },
  body: { enabled: false },
  hand: { enabled: false },
  object: { enabled: false },
  gesture: { enabled: false },
  segmentation: { enabled: false },
}

const human = new Human(humanConfig)
const similarityThreshold = 0.5
let initPromise: Promise<void> | null = null

function validarFace(face: FaceResult | undefined): string | null {
  if (!face) return 'Nenhum rosto detectado.'

  const confidence = face.faceScore || face.boxScore || face.score || 0
  if (confidence < 0.4) return 'Não foi possível confirmar o rosto com nitidez suficiente.'

  const minBox = Math.min(face.box?.[2] ?? 0, face.box?.[3] ?? 0)
  if (minBox < 140) return 'Aproxime um pouco o rosto da câmera.'

  const yaw = Math.abs(face.rotation?.angle?.yaw ?? 0)
  const pitch = Math.abs(face.rotation?.angle?.pitch ?? 0)
  const roll = Math.abs(face.rotation?.angle?.roll ?? 0)
  if (yaw > 20 || pitch > 20 || roll > 20) return 'Olhe de frente para a câmera.'

  if (!face.embedding || face.embedding.length === 0) {
    return 'Não foi possível gerar o descriptor facial.'
  }

  return null
}

async function ensureReady(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      await human.load()
    })()
  }
  return initPromise
}

async function detectSingleFace(video: HTMLVideoElement): Promise<FaceResult> {
  await ensureReady()
  const result = await human.detect(video)

  if (!result.face || result.face.length === 0) {
    throw new Error('Nenhum rosto detectado. Posicione o rosto no centro da câmera.')
  }
  if (result.face.length > 1) {
    throw new Error('Mais de um rosto detectado. Deixe apenas uma pessoa enquadrada.')
  }

  const face = result.face[0]
  const erro = validarFace(face)
  if (erro) throw new Error(erro)

  return face
}

function serializeDescriptor(embedding: number[]): string {
  return JSON.stringify(embedding)
}

function parseDescriptor(descriptor: string): number[] {
  const parsed = JSON.parse(descriptor)
  if (!Array.isArray(parsed) || parsed.some((value) => typeof value !== 'number')) {
    throw new Error('Descriptor facial inválido.')
  }
  return parsed
}

export const faceRecognitionService = {
  threshold: similarityThreshold,
  init: ensureReady,
  async captureDescriptor(video: HTMLVideoElement): Promise<number[]> {
    const face = await detectSingleFace(video)
    return [...(face.embedding ?? [])]
  },
  compareDescriptors(reference: number[], current: number[]): number {
    return human.match.similarity(reference, current)
  },
  serializeDescriptor,
  parseDescriptor,
}
