import libTyp from './template/lib.typ?raw';
import type { TemplateModule } from '../types';
import type { ResumeData } from './types';
import { buildMainTyp } from './codegen';
import { RESUME_EMPTY_DATA } from './defaults';

// Strip fields that must never leak into a share link.
// §1 of CONSEPT_AND_PLAN excludes photos from the default share payload.
function sanitizeForShare(data: ResumeData): ResumeData {
	return { ...data, 写真: null };
}

export const resumeModule: TemplateModule<ResumeData> = {
	id: 'resume',
	label: '履歴書',
	enabled: true,
	defaults: RESUME_EMPTY_DATA,
	sources: { '/lib.typ': libTyp },
	mainPath: '/main.typ',
	buildMainTyp,
	FormComponent: null,
	sanitizeForShare
};
