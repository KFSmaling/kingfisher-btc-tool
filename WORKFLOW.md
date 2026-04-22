# Workflow — BTC Tool

## Drie kanalen, drie rollen

- **Jam.dev** → test-bevindingen tijdens gebruik (bugs, UX-frictie, regressies)
- **GitHub Issues** → features en concrete bugs met duidelijke scope
- **TECH_DEBT.md** → architectuur, patronen, governance, cross-cutting concerns

Alles moet in één van de drie landen. Niks in het hoofd laten.

## Beslisboom

Is het een observatie tijdens app-gebruik? → **Jam**
Is het een feature of bug met duidelijke scope, oplosbaar in één sprint? → **Issue**
Vraagt het denkwerk, ontwerpkeuzes of meerdere sprints? → **TECH_DEBT.md**

Bij twijfel tussen Issue en TECH_DEBT: kan dit zonder vooraf ontwerpkeuzes? 
Ja → Issue. Nee → TECH_DEBT.

## Grijze gebieden

**Bug én compliance-probleem** (bijv. silent save failure die P2 schendt):
- Issue voor de concrete bug met repro-stappen
- TECH_DEBT voor het onderliggende patroon
- Fix van de bug vinkt één sub-item in TECH_DEBT af; het patroon blijft open tot alle instances gefixt zijn

**Feature die architectuur raakt**:
- Eerst TECH_DEBT-vraag beantwoorden ("hoe verhoudt dit zich tot kennis-architectuur?")
- Pas dan Issue aanmaken voor de feature

## Sprint-samenstelling

Max 3-5 Issues per sprint. Regels:
1. Geen Issues uit verschillende werkbladen tegelijk, tenzij ze expliciet samenhangen
2. Geen architectuur-werk (TECH_DEBT P4/P5) combineren met feature-werk
3. Bij elk raak-bestand: fix één compliance-item uit TECH_DEBT mee (boy-scout rule)
4. Als je voelt "dit is te veel" — dan is het te veel. Halveer.

## Bij elke feature-afronding

1. Close het Issue
2. TECH_DEBT Done log regel toevoegen
3. CLAUDE.md §4.6 compliance-status bijwerken als relevant
4. Eventuele nieuwe bevindingen uit sprint → Jam of Issue
