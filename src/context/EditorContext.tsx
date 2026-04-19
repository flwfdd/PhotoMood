import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { EditorState, EditorAction } from '../types/editor'
import type { TemplateDefinition, TemplateElement } from '../types/template'
import { builtinTemplates } from '../templates/index'

const defaultTemplate = builtinTemplates[0]!

function normalizeTemplate(tpl: TemplateDefinition): TemplateDefinition {
  const layout = { ...tpl.layout }
  if (layout.imageOpacity == null) layout.imageOpacity = 1
  if (layout.crop == null) layout.crop = null
  const elements = tpl.elements.map((element) =>
    element.type === 'text'
      ? { ...element, style: { blendMode: 'normal' as const, ...element.style } }
      : element
  )
  return { ...tpl, layout, elements }
}

const initialState: EditorState = {
  originalImage: null,
  croppedImage: null,
  imageSize: { width: 0, height: 0 },
  exifData: null,
  dominantColor: '#F4F3EE',
  palette: [],
  swatches: {},
  isDark: false,
  currentTemplate: normalizeTemplate(structuredClone(defaultTemplate)),
  cropFocus: [0.5, 0.5],
  selectedTextElementId: null,
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
        cropFocus: [0.5, 0.5],
        activePanel: 'template',
      }

    case 'SET_EXIF':
      return { ...state, exifData: action.payload }

    case 'SET_COLOR_PALETTE':
      return {
        ...state,
        dominantColor: action.payload.dominant,
        palette: action.payload.palette,
        swatches: action.payload.swatches,
        isDark: action.payload.isDark,
      }

    case 'SET_TEMPLATE':
      return {
        ...state,
        currentTemplate: normalizeTemplate(structuredClone(action.payload)),
        cropFocus: [0.5, 0.5],
        selectedTextElementId: null,
      }

    case 'UPDATE_TEMPLATE':
      return {
        ...state,
        currentTemplate: { ...state.currentTemplate, ...action.payload },
      }

    case 'UPDATE_LAYOUT':
      return {
        ...state,
        currentTemplate: {
          ...state.currentTemplate,
          layout: { ...state.currentTemplate.layout, ...action.payload },
        },
      }

    case 'UPDATE_ELEMENT': {
      const elements = state.currentTemplate.elements.map((el) =>
        el.id === action.payload.id ? { ...el, ...action.payload.updates } : el
      )
      return {
        ...state,
        currentTemplate: { ...state.currentTemplate, elements },
      }
    }

    case 'ADD_ELEMENT':
      return {
        ...state,
        currentTemplate: {
          ...state.currentTemplate,
          elements: [...state.currentTemplate.elements, action.payload],
        },
      }

    case 'REMOVE_ELEMENT':
      return {
        ...state,
        selectedTextElementId: state.selectedTextElementId === action.payload ? null : state.selectedTextElementId,
        currentTemplate: {
          ...state.currentTemplate,
          elements: state.currentTemplate.elements.filter((el) => el.id !== action.payload),
        },
      }

    case 'REORDER_ELEMENTS':
      return {
        ...state,
        currentTemplate: {
          ...state.currentTemplate,
          elements: action.payload as TemplateElement[],
        },
      }

    case 'SET_CROP_FOCUS':
      return { ...state, cropFocus: action.payload }

    case 'SELECT_TEXT_ELEMENT':
      return { ...state, selectedTextElementId: action.payload }

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
