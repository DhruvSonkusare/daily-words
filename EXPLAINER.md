# Explainer

## What I built
**Daily Words**: five short English-word questions a day. Everyone gets the same five on the same day. Finishing them gives points, keeps your streak, levels you up and unlocks badges.

## Why this idea
Your users are on cheap phones, mobile data, and read English as a second language. So:
- **Light:** ~30 KB, no framework, no fonts, no images (pictures are emoji). It loads fast and works offline after the first visit.
- **Easy language:** short words, three choices instead of four, big tap targets, every answer shown in a full sentence, and a 🔊 button that reads it aloud.
- **Useful, not just a game:** the words are everyday and work-related (bus, salary, boss, bank), so the reward is real learning too.

## Rewards
- **Streak** (days in a row) is the main reason to come back. The 7-dot week shows it at a glance.
- **Points:** 10 per right answer, +20 for a perfect day, a small streak bonus.
- **Levels** get slowly harder to reach (100, 300, 600 points...).
- **7 badges:** first day, 3/7/30-day streaks, perfect day, 25 words, level 5.
- **Daily challenge:** the same 5 questions for everyone, so scores can be compared and shared.
- A wrong answer never costs points. It just shows the right answer and a sentence.
- Only the first round each day earns points, so replaying cannot farm them. Practice mode is there for extra learning.

## What I left out, and why
- **A real leaderboard and money rewards.** You said earnings are worth real money to your users. That changes the design: points kept only on a phone can be edited, and the phone clock can be changed. A fair version needs a server that picks the questions, checks the answers, and uses its own date. I did not fake a leaderboard with made-up names, because that would be dishonest. This is what I would build next.
- **Accounts and sync.** Progress lives on one phone. Clearing browser data loses it.
- **Streak freeze, reminders, languages.** Good next steps. Hindi/regional meanings beside each word would help most.
- **More content.** 60 words is about 12 days before repeats are common. Words are one line each in `words.js`.

## Technical choices
- Plain JavaScript, no build step, so anyone can clone and run it. Game rules are in `logic.js`, separate from the screens, so they are testable.
- Daily questions come from the date as a seed, so no server is needed for "the same questions for everyone".
- Offline through a small service worker. If saving or speech is not available on a phone, the app still works.
- Dark mode, reduced-motion support, visible focus, 56px buttons.

## Where I used AI
I used Claude Code (Anthropic) to write the first version of the code, the 60-word list, the tests and this document.

What was mine: choosing the idea and the audience (low-end phones, English as a second language), deciding what to leave out, and directing the work. For example, I asked for the game logic to be rewritten in simpler, easier-to-read code. I also set up the repository and deployed the app myself.
