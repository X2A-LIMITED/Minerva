import { createContext, type ActionDispatch } from 'react';
import {
    VOICE_NAME,
    type VoiceName,
} from '../genAI/speechGenerator/speechGenerate';
import {
    SUMMARY_LENGTH,
    SUMMARY_TYPE,
    type SummaryLength,
    type SummaryType,
} from '../genAI/summarizer/summarizeAPI';

export type Settings = {
    autoSummaryWhitelist: string[];
    autoSummaryEnabled: boolean;
    voice: VoiceName;
    summaryType: SummaryType;
    summaryLength: SummaryLength;
    apiKey: string;
};

export type SettingsAction =
    | { type: 'setAutoSummaryWhitelist'; autoSummaryWhitelist: string[] }
    | { type: 'setAutoSummaryEnabled'; autoSummaryEnabled: boolean }
    | { type: 'setVoice'; voice: VoiceName }
    | { type: 'setSummaryType'; summaryType: SummaryType }
    | { type: 'setSummaryLength'; summaryLength: SummaryLength }
    | { type: 'setApiKey'; apiKey: string };

export function settingsReducer(
    settings: Settings,
    action: SettingsAction
): Settings {
    switch (action.type) {
        case 'setAutoSummaryWhitelist':
            return {
                ...settings,
                autoSummaryWhitelist: action.autoSummaryWhitelist,
            };
        case 'setAutoSummaryEnabled':
            return {
                ...settings,
                autoSummaryEnabled: action.autoSummaryEnabled,
            };
        case 'setVoice':
            return {
                ...settings,
                voice: action.voice,
            };
        case 'setSummaryType':
            return {
                ...settings,
                summaryType: action.summaryType,
            };
        case 'setSummaryLength':
            return {
                ...settings,
                summaryLength: action.summaryLength,
            };
        case 'setApiKey':
            return {
                ...settings,
                apiKey: action.apiKey,
            };
    }
}

export const DefaultSettings = {
    autoSummaryWhitelist: [],
    autoSummaryEnabled: false,
    voice: VOICE_NAME.ZEPHYR,
    summaryType: SUMMARY_TYPE.TLDR,
    summaryLength: SUMMARY_LENGTH.MEDIUM,
    apiKey: '',
};

export const SettingsContext = createContext<Settings | null>(null);
export const SettingsDispatchContext = createContext<ActionDispatch<
    [action: SettingsAction]
> | null>(null);
