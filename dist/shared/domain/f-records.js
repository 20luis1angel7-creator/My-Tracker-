import { dateKey } from "./calendar.js";
import { weekStart } from "./statistics.js";
const select = (id, label, options) => ({
    id,
    label,
    type: "select",
    options,
});
const multi = (id, label, options) => ({
    id,
    label,
    type: "multi",
    options,
});
const scale = (id, label) => ({
    id,
    label,
    type: "scale",
});
const text = (id, label, optional = false) => ({
    id,
    label,
    type: "text",
    optional,
});
export const F_EMOTIONS = [
    "Aburrimiento",
    "Estrés o ansiedad",
    "Tristeza o soledad",
    "Frustración o enojo",
    "Cansancio o falta de sueño",
    "Excitación sexual",
    "Curiosidad",
    "Ganas de escapar de mis problemas",
    "No sentía nada en particular",
    "Otro motivo",
];
export const F_BEHAVIORS = [
    "Pornografía",
    "Masturbación",
    "Orgasmo",
    "Edging",
    "Fantasías sexuales intencionales",
];
export const F_QUESTIONS = {
    relapse: [
        {
            title: "A. Contexto de la recaída",
            questions: [
                select("when", "1. ¿Cuándo ocurrió?", [
                    "Acaba de ocurrir",
                    "Hace unas horas",
                    "Otro día",
                ]),
                select("before", "2. ¿Qué estabas haciendo antes?", [
                    "Navegando por redes sociales",
                    "Estudiando o trabajando",
                    "Jugando videojuegos",
                    "Acostado o intentando dormir",
                    "Sin nada que hacer",
                    "Otra actividad",
                ]),
                select("place", "3. ¿Dónde estabas?", [
                    "En mi habitación",
                    "En el baño",
                    "Fuera de casa",
                    "Otro lugar",
                ]),
                select("alone", "4. ¿Estabas solo?", [
                    "Sí, estaba solo",
                    "No, había gente cerca",
                ]),
            ],
        },
        {
            title: "B. Desencadenantes",
            questions: [
                multi("emotions", "5. ¿Qué sentías antes de recaer?", F_EMOTIONS),
                select("trigger", "6. ¿Qué desencadenó el impulso?", [
                    "Vi una imagen o un vídeo sugerente",
                    "Estaba navegando por redes sociales",
                    "Apareció un recuerdo o una fantasía",
                    "Me sentía mal emocionalmente",
                    "Estaba solo y tenía acceso al teléfono",
                    "Empecé por costumbre, sin pensarlo",
                    "No identifiqué un desencadenante",
                ]),
                select("beginning", "7. ¿Cómo comenzó?", [
                    "Lo busqué intencionalmente",
                    "Apareció contenido inesperado y decidí continuar",
                    "Empecé con una fantasía y después pasé a otra conducta",
                    "Comenzó como un impulso espontáneo",
                    "No estoy seguro",
                ]),
                select("delay", "8. ¿Cuánto tiempo pasó desde el primer impulso hasta actuar?", [
                    "Menos de un minuto",
                    "Entre 1 y 5 minutos",
                    "Entre 5 y 15 minutos",
                    "Entre 15 y 30 minutos",
                    "Más de 30 minutos",
                ]),
                scale("intensity", "9. ¿Qué tan intenso era el impulso?"),
                text("difficultyReason", "10. ¿Qué crees que hizo más difícil resistirlo?"),
            ],
        },
        {
            title: "C. Durante la recaída",
            questions: [
                multi("behaviors", "11. ¿Qué comportamiento ocurrió?", F_BEHAVIORS),
                scale("control", "12. ¿Cuánto control sentías que tenías?"),
                select("stopping", "13. ¿Intentaste detenerte antes de continuar?", [
                    "No lo intenté",
                    "Lo intenté una vez",
                    "Lo intenté varias veces",
                    "Conseguí detenerme durante un tiempo, pero después continué",
                ]),
                select("continuing", "14. ¿Qué te hizo continuar?", [
                    "Quería experimentar más placer",
                    "Quería aliviar el estrés",
                    "Sentía que ya había roto mi racha",
                    "Me costaba cambiar de actividad",
                    "Pensé que podía controlarlo y terminé continuando",
                    "Otro motivo",
                ]),
            ],
        },
        {
            title: "D. Después de la recaída",
            questions: [
                select("after", "15. ¿Cómo te sentiste después?", [
                    "Tranquilo o aliviado",
                    "Culpable",
                    "Triste",
                    "Frustrado",
                    "Vacío",
                    "Indiferente",
                    "Con ganas de repetirlo",
                ]),
                select("impact", "16. ¿Cómo afectó tu día?", [
                    "No tuvo un efecto significativo",
                    "Perdí tiempo",
                    "Descuidé tareas",
                    "Dormí menos",
                    "Me costó concentrarme",
                    "Afectó mi estado de ánimo",
                ]),
                text("earlySignal", "17. ¿Qué señal temprana podrías haber reconocido?"),
                select("nextStrategy", "18. ¿Qué harás diferente la próxima vez?", [
                    "Dejar el teléfono fuera de la habitación",
                    "Bloquear o limitar el acceso al contenido",
                    "Salir del lugar donde estoy",
                    "Hacer ejercicio o caminar",
                    "Hablar con alguien",
                    "Cambiar a una actividad concreta",
                    "Otra estrategia",
                ]),
            ],
        },
    ],
    success: [
        {
            title: "A. ¿Qué pasó cuando apareció el impulso?",
            questions: [
                select("urge", "1. ¿Qué impulso lograste superar?", [
                    "Ganas de ver pornografía",
                    "Ganas de masturbarme",
                    "Ganas de buscar un orgasmo mediante una conducta que quiero evitar",
                    "Ganas de practicar edging",
                    "Ganas de alimentar deliberadamente fantasías sexuales",
                ]),
                scale("intensity", "2. ¿Qué tan fuerte era el impulso?"),
                select("duration", "3. ¿Cuánto duró aproximadamente?", [
                    "Menos de 5 minutos",
                    "5–15 minutos",
                    "15–30 minutos",
                    "Más de 30 minutos",
                ]),
                select("strategy", "4. ¿Qué hiciste para superarlo?", [
                    "Cambié de actividad",
                    "Dejé el teléfono o la computadora",
                    "Salí del lugar donde estaba",
                    "Dejé que el impulso pasara sin actuar",
                    "Hablé con alguien",
                    "Hice ejercicio o caminé",
                    "Otra estrategia",
                ]),
            ],
        },
        {
            title: "B. Aprender de la superación",
            questions: [
                select("helped", "5. ¿Qué te ayudó más a no actuar?", [
                    "Recordé mi objetivo",
                    "Pensé en las consecuencias de recaer",
                    "Cambié mi entorno",
                    "Me mantuve ocupado",
                    "El impulso desapareció por sí solo",
                    "Utilicé una estrategia que había preparado",
                    "Otra razón",
                ]),
                multi("emotions", "6. ¿Qué emoción sentías cuando apareció el impulso?", F_EMOTIONS),
                scale("difficulty", "7. ¿Qué tan difícil fue resistirlo?"),
                select("after", "8. ¿Cómo te sientes ahora que lo superaste?", [
                    "Satisfecho",
                    "Tranquilo",
                    "Más seguro de mí mismo",
                    "Todavía siento el impulso",
                    "Frustrado por haber tenido esa tentación",
                    "Otro estado emocional",
                ]),
                text("learning", "9. ¿Qué aprendiste de esta experiencia?"),
                select("repeat", "10. ¿Volverías a utilizar la misma estrategia?", [
                    "Sí, funcionó bien",
                    "Tal vez, pero haría algún cambio",
                    "No, necesito probar otra estrategia",
                ]),
                text("prevention", "11. ¿Qué te gustaría hacer para prevenir otro impulso parecido?", true),
            ],
        },
    ],
};
export function questionError(question, answer) {
    if (question.optional && (answer === "" || answer === undefined))
        return null;
    if (question.type === "multi")
        return Array.isArray(answer) &&
            answer.length > 0 &&
            answer.every((v) => question.options.includes(v))
            ? null
            : "Selecciona al menos una opción.";
    if (question.type === "scale")
        return Number.isInteger(answer) &&
            Number(answer) >= 1 &&
            Number(answer) <= 10
            ? null
            : "Elige un valor entre 1 y 10.";
    if (typeof answer !== "string" || !answer.trim() || answer.length > 4000)
        return "Completa esta respuesta.";
    return question.type === "select" && !question.options.includes(answer)
        ? "Selecciona una opción válida."
        : null;
}
export function validateFRecord(value, now = new Date()) {
    if (!value || typeof value !== "object")
        return "Registro inválido.";
    const record = value;
    if (typeof record.id !== "string" ||
        !record.id ||
        !["relapse", "success"].includes(record.kind))
        return "Tipo de registro inválido.";
    const date = new Date(record.occurredAt);
    if (typeof record.occurredAt !== "string" ||
        !Number.isFinite(date.getTime()) ||
        date > now)
        return "Selecciona una fecha válida que no esté en el futuro.";
    if (!record.answers ||
        typeof record.answers !== "object" ||
        Array.isArray(record.answers))
        return "Respuestas inválidas.";
    for (const section of F_QUESTIONS[record.kind])
        for (const question of section.questions) {
            const error = questionError(question, record.answers[question.id]);
            if (error)
                return `${question.label} ${error}`;
        }
    return null;
}
export function fPeriod(records, anchor, period) {
    const start = period === "week"
        ? weekStart(anchor)
        : new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const length = period === "week"
        ? 7
        : new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    return Array.from({ length }, (_, i) => {
        const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i), day = dateKey(date);
        const items = records.filter((r) => r.occurredAt.slice(0, 10) === day);
        return {
            date,
            day,
            relapse: items.filter((r) => r.kind === "relapse").length,
            success: items.filter((r) => r.kind === "success").length,
        };
    });
}
export function fPatterns(records, kind, key) {
    const counts = new Map();
    for (const record of records.filter((r) => r.kind === kind)) {
        const value = record.answers[key];
        for (const answer of Array.isArray(value) ? new Set(value) : [value])
            if (typeof answer === "string" && answer)
                counts.set(answer, (counts.get(answer) || 0) + 1);
    }
    return [...counts].sort((a, b) => b[1] - a[1]);
}
//# sourceMappingURL=f-records.js.map