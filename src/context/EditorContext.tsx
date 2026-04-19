import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { EditorState, EditorAction } from '../types/editor'
import { templateRegistry } from '../templates/registry'

const initialState: EditorState = {
  originalImage: null,
  croppedImage: null,
  imageSize: { width: 0, height: 0 },
  exifData: null,
  selectedExifFields: [],
  dominantColor: '#F4F3EE',
  palette: [],
  isDark: false,
  frameColor: '#F4F3EE',
  textColor: '#2D2B2A',
  currentTemplateId: templateRegistry[0]?.id ?? 'polaroid',
  templateOverrides: {},
  textOverrides: {},
  activePanel: null,
  canvasScale: 1,
}

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_IMAGE':
      return {
        ...state,
        originalImage: action.payload.original,
        croppedImage: action.payload.original,
        imageSize: action.payload.size,
        textOverrides: {},
        templateOverrides: {},
        activePanel: 'template',
      }
    case 'SET_CROPPED_IMAGE':
      return { ...state, croppedImage: action.payload }
    case 'SET_EXIF':
      return {
        ...state,
        exifData: action.payload,
        selectedExifFields: action.payload
          ? templateRegistry
              .find((t) => t.id === state.currentTemplateId)
              ?.defaultExifFields.map((f) => f.field) ?? []
          : [],
      }
    case 'SET_COLOR_PALETTE':
      return {
        ...state,
        dominantColor: action.payload.dominant,
        palette: action.payload.palette,
        isDark: action.payload.isDark,
        frameColor: action.payload.dominant,
        textColor: action.payload.isDark ? '#F4F3EE' : '#2D2B2A',
      }
    case 'SET_FRAME_COLOR':
      return { ...state, frameColor: action.payload }
    case 'SET_TEXT_COLOR':
      return { ...state, textColor: action.payload }
    case 'SET_TEMPLATE':
      return {
        ...state,
        currentTemplateId: action.payload,
        templateOverrides: {},
        selectedExifFields: templateRegistry
          .find((t) => t.id === action.payload)
          ?.defaultExifFields.map((f) => f.field) ?? [],
      }
    case 'SET_TEMPLATE_OVERRIDES':
      return { ...state, templateOverrides: { ...state.templateOverrides, ...action.payload } }
    case 'SET_TEXT_OVERRIDE':
      return {
        ...state,
        textOverrides: {
          ...state.textOverrides,
          [action.payload.id]: { ...state.textOverrides[action.payload.id], ...action.payload.override },
        },
      }
    case 'TOGGLE_EXIF_FIELD': {
      const field = action.payload
      const fields = state.selectedExifFields.includes(field)
        ? state.selectedExifFields.filter((f) => f !== field)
        : [...state.selectedExifFields, field]
      return { ...state, selectedExifFields: fields }
    }
    case 'SET_ACTIVE_PANEL':
      return { ...state, activePanel: action.payload }
    case 'SET_CANVAS_SCALE':
      return { ...state, canvasScale: action.payload }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

interface EditorContextValue {
  state: EditorState
  dispatch: React.Dispatch<EditorAction>
}

const EditorContext = createContext<EditorContextValue | null>(null)

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(editorReducer, initialState)
  return <EditorContext value={{ state, dispatch }}>{children}</EditorContext>
}

export function useEditor() {
  const ctx = useContext(EditorContext)
  if (!ctx) throw new Error('useEditor must be used within EditorProvider')
  return ctx
}
