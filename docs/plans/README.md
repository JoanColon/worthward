# Planes persistentes

Usa un plan cuando el trabajo abarque varias fases o sesiones, tenga dependencias relevantes o deba
ser retomado sin el contexto de la conversación. Una corrección pequeña no necesita plan.

Los planes activos viven en `active/` y, cuando existan, los terminados pasan a `completed/`. No se
crean retrospectivamente planes ficticios para funcionalidades ya implementadas.

## Contenido recomendado

```markdown
# Título

## Estado

## Objetivo

## Contexto y evidencia

## Alcance

## Fuera de alcance

## Requisitos y decisiones aprobadas

## Dependencias y riesgos

## Fases

## Tareas pendientes

## Criterios de aceptación

## Validación

## Cuestiones abiertas

## Siguiente paso
```

El estado debe describir hechos, no intención. Actualiza tareas, decisiones y siguiente paso al
terminar cada fase. Enlaza código y documentación en lugar de copiar contratos enteros.

## Cierre

Antes de mover un plan a `completed/`:

1. completa o descarta explícitamente todas las tareas;
2. ejecuta y registra validaciones reales;
3. traslada decisiones permanentes a `DECISIONS.md`;
4. actualiza producto, arquitectura, datos, finanzas, acceso u operaciones si cambió un contrato;
5. deja cuestiones no resueltas en un nuevo plan o en decisiones pendientes.

Un plan completado es historia de implementación, no una fuente normativa.
