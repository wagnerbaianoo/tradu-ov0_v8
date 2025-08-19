"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Globe } from "lucide-react"

interface LanguageSelectorProps {
  selectedLanguages: {
    source: string
    target: string
  }
  onLanguageChange: (languages: { source: string; target: string }) => void
}

const LANGUAGE_OPTIONS = [
  { code: "pt-BR", name: "Português (Brasil)", flag: "🇧🇷" },
  { code: "en-US", name: "English (US)", flag: "🇺🇸" },
  { code: "es-ES", name: "Español (España)", flag: "🇪🇸" },
  { code: "fr-FR", name: "Français (France)", flag: "🇫🇷" },
  { code: "de-DE", name: "Deutsch (Deutschland)", flag: "🇩🇪" },
  { code: "it-IT", name: "Italiano (Italia)", flag: "🇮🇹" },
  { code: "ja-JP", name: "日本語 (Japan)", flag: "🇯🇵" },
  { code: "ko-KR", name: "한국어 (Korea)", flag: "🇰🇷" },
  { code: "zh-CN", name: "中文 (China)", flag: "🇨🇳" },
  { code: "ru-RU", name: "Русский (Russia)", flag: "🇷🇺" },
  { code: "ar-SA", name: "العربية (Saudi Arabia)", flag: "🇸🇦" },
  { code: "libras", name: "Libras (Brasil)", flag: "🤟" },
]

const PRESET_COMBINATIONS = [
  { source: "pt-BR", target: "en-US", name: "Português → Inglês" },
  { source: "pt-BR", target: "es-ES", name: "Português → Espanhol" },
  { source: "en-US", target: "pt-BR", name: "Inglês → Português" },
  { source: "en-US", target: "es-ES", name: "Inglês → Espanhol" },
  { source: "es-ES", target: "pt-BR", name: "Espanhol → Português" },
  { source: "es-ES", target: "en-US", name: "Espanhol → Inglês" },
  { source: "pt-BR", target: "libras", name: "Português → Libras" },
  { source: "en-US", target: "libras", name: "Inglês → Libras" },
]

export function LanguageSelector({ selectedLanguages, onLanguageChange }: LanguageSelectorProps) {
  const getLanguageDisplay = (code: string) => {
    const lang = LANGUAGE_OPTIONS.find((l) => l.code === code)
    return lang ? `${lang.flag} ${lang.name}` : code
  }

  const handlePresetSelect = (preset: { source: string; target: string }) => {
    onLanguageChange(preset)
  }

  return (
    <div className="space-y-4">
      {/* Preset Combinations */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-white flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Combinações Pré-definidas
        </label>
        <div className="grid grid-cols-1 gap-2">
          {PRESET_COMBINATIONS.map((preset, index) => (
            <button
              key={index}
              onClick={() => handlePresetSelect(preset)}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedLanguages.source === preset.source && selectedLanguages.target === preset.target
                  ? "bg-blue-500/20 border-blue-400 text-white"
                  : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
              }`}
            >
              <div className="text-sm font-medium">{preset.name}</div>
              <div className="text-xs opacity-75 mt-1">
                {getLanguageDisplay(preset.source)} → {getLanguageDisplay(preset.target)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Manual Selection */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="text-sm font-medium text-white mb-3">Seleção Manual</div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Source Language */}
              <div className="space-y-2">
                <label className="text-xs text-slate-300">Idioma de Origem</label>
                <Select
                  value={selectedLanguages.source}
                  onValueChange={(value) => onLanguageChange({ ...selectedLanguages, source: value })}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <ArrowRight className="w-6 h-6 text-slate-400" />
              </div>

              {/* Target Language */}
              <div className="space-y-2">
                <label className="text-xs text-slate-300">Idioma de Destino</label>
                <Select
                  value={selectedLanguages.target}
                  onValueChange={(value) => onLanguageChange({ ...selectedLanguages, target: value })}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.filter((lang) => lang.code !== selectedLanguages.source).map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
