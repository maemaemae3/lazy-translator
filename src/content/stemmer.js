// https://github.com/words/stemmer

// Standard suffix manipulations.
const step2list = {
  ational: 'ate',
  tional: 'tion',
  enci: 'ence',
  anci: 'ance',
  izer: 'ize',
  bli: 'ble',
  alli: 'al',
  entli: 'ent',
  eli: 'e',
  ousli: 'ous',
  ization: 'ize',
  ation: 'ate',
  ator: 'ate',
  alism: 'al',
  iveness: 'ive',
  fulness: 'ful',
  ousness: 'ous',
  aliti: 'al',
  iviti: 'ive',
  biliti: 'ble',
  logi: 'log'
}

const step3list = {
  icate: 'ic',
  ative: '',
  alize: 'al',
  iciti: 'ic',
  ical: 'ic',
  ful: '',
  ness: ''
}

// Consonant-vowel sequences.
const consonant = '[^aeiou]';
const vowel = '[aeiouy]';
const consonants = `(${consonant}[^aeiouy]*)`;
const vowels = `(${vowel}[aeiou]*)`;

const gt0 = new RegExp(`^${consonants}?${vowels}${consonants}`);
const eq1 = new RegExp(`^${consonants}?${vowels}${consonants}${vowels}?$`);
const gt1 = new RegExp(`^${consonants}?(${vowels}${consonants}){2,}`);
const vowelInStem = new RegExp(`^${consonants}?${vowel}`);
const consonantLike = new RegExp(`^${consonants}${vowel}[^aeiouwxy]$`);

// Exception expressions.
const sfxLl = /ll$/;
const sfxE = /^(.+?)e$/;
const sfxY = /^(.+?)y$/;
const sfxIon = /^(.+?(s|t))(ion)$/;
const sfxEdOrIng = /^(.+?)(ed|ing)$/;
const sfxAtOrBlOrIz = /(at|bl|iz)$/;
const sfxEED = /^(.+?)eed$/;
const sfxS = /^.+?[^s]s$/;
const sfxSsesOrIes = /^.+?(ss|i)es$/;
const sfxMultiConsonantLike = /([^aeiouylsz])\1$/;
const step2 = /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;
const step3 = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;
const step4 = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;

// Stem `value`.
export default function stemmer(value) {
  let match;
  value = String(value).toLowerCase();

  if (value.length < 3) { return value; } // ignore short word

  // Detect initial `y`, make sure it never matches.
  const firstCharacterWasLowerCaseY = value.charCodeAt(0) === 121;
  if (firstCharacterWasLowerCaseY) { // Lowercase Y
    value = 'Y' + value.slice(1);
  }

  // Step 1a.
  if (sfxSsesOrIes.test(value)) {
    value = value.slice(0, value.length - 2); // Remove last two characters.
  } else if (sfxS.test(value)) {
    value = value.slice(0, value.length - 1); // Remove last character.
  }

  // Step 1b.
  if ((match = sfxEED.exec(value))) {
    if (gt0.test(match[1])) {
      value = value.slice(0, value.length - 1); // Remove last character.
    }
  } else if ((match = sfxEdOrIng.exec(value)) && vowelInStem.test(match[1])) {
    value = match[1];

    if (sfxAtOrBlOrIz.test(value)) {
      value += 'e'; // Append 'e'.
    } else if (sfxMultiConsonantLike.test(value)) {
      value = value.slice(0, value.length - 1); // Remove last character.
    } else if (consonantLike.test(value)) {
      value += 'e' // Append 'e'.
    }
  }

  // Step 1c.
  if ((match = sfxY.exec(value)) && vowelInStem.test(match[1])) {
    value = match[1] + 'i'; // Remove suffixing 'y' and append 'i'.
  }

  // Step 2.
  if ((match = step2.exec(value)) && gt0.test(match[1])) {
    value = match[1] + step2list[match[2]];
  }

  // Step 3.
  if ((match = step3.exec(value)) && gt0.test(match[1])) {
    value = match[1] + step3list[match[2]];
  }

  // Step 4.
  if ((match = step4.exec(value))) {
    if (gt1.test(match[1])) {
      value = match[1];
    }
  } else if ((match = sfxIon.exec(value)) && gt1.test(match[1])) {
    value = match[1];
  }

  // Step 5.
  const isEndedWithE = sfxE.exec(value);
  if (isEndedWithE && (gt1.test(isEndedWithE[1]) || (eq1.test(isEndedWithE[1]) && !consonantLike.test(isEndedWithE[1])))) {
    value = isEndedWithE[1]
  }

  if (sfxLl.test(value) && gt1.test(value)) {
    value = value.slice(0, value.length - 1)
  }

  // Turn initial `Y` back to `y`.
  if (firstCharacterWasLowerCaseY) {
    value = 'y' + value.slice(1)
  }

  return value;
}