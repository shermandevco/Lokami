import type { Space } from '../store'
import { t } from './i18n'
import type { Key } from '../i18n/en'
export const spaceName = (s?: Space) => !s ? '' : s.type === 'solo' ? t('personal') : s.name || t(('type_' + s.type) as Key)
export const spaceIcon = (s?: Space) => ({ solo: '🙂', couple: '💞', friends: '🍻', mates: '🏠', family: '👨‍👩‍👧' } as const)[s?.type || 'solo']
