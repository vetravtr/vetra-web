import { clsx, type ClassValue } from "clsx";


/**
 * Função utilitária para combinar classes Tailwind de forma organizada e legível
 * Permite agrupar classes por categoria e facilita a manutenção.
 * Usa `clsx` para lógica condicional e `tailwind-merge` para resolver conflitos de classes.
 */
import { extendTailwindMerge } from "tailwind-merge";

const customTwMerge = extendTailwindMerge({
	extend: {
		classGroups: {
			"font-family": ["font-inter"],
		},
	},
});

export function cn(...inputs: ClassValue[]) {
	return customTwMerge(clsx(inputs));
}

/**
 * Organiza classes Tailwind em grupos para melhor legibilidade
 * Útil para componentes com muitas classes
 */
export function classGroups(groups: Record<string, string | undefined | null | false>): string {
	return Object.values(groups).filter(Boolean).join(' ');
}

