export const keyDescriptions: Array<[string, number, string]> = [
    ['\b', 8, 'Backspace'],
    ['\t', 9, 'Tab'],
    ['\n', 13, 'Enter'],
    [' ', 32, 'Space'],
    ['`~', 192, 'Backquote'],
    ['1!¡⁄', 49, 'Digit1'],
    ['2@™€', 50, 'Digit2'],
    ['3#£‹', 51, 'Digit3'],
    ['4$¢›', 52, 'Digit4'],
    ['5%∞ﬁ', 53, 'Digit5'],
    ['6^§ﬂ', 54, 'Digit6'],
    ['7&¶‡', 55, 'Digit7'],
    ['8*•°', 56, 'Digit8'],
    ['9(ª·', 57, 'Digit9'],
    ['0)º‚', 48, 'Digit0'],
    ['-_–—', 189, 'Minus'],
    ['=+≠±', 187, 'Equal'],
    ['qQœŒйЙ', 81, 'KeyQ'],
    ['wW∑„цЦ', 87, 'KeyW'],
    ['eE´´уУ', 69, 'KeyE'],
    ['rR®‰кК', 82, 'KeyR'],
    ['tT†ˇеЕ', 84, 'KeyT'],
    ['yY¥ÁнН', 89, 'KeyY'],
    ['uU¨¨гГ', 85, 'KeyU'],
    ['iIˆˆшШ', 73, 'KeyI'],
    ['oOøØщЩ', 79, 'KeyO'],
    ['pPπ∏зЗ', 80, 'KeyP'],
    ['[{“”хХ', 219, 'BracketLeft'],
    [']}‘’ъЪ', 221, 'BracketRight'],
    ['\\|«»', 220, 'Backslash'],
    ['aAåÅфФ', 65, 'KeyA'],
    ['sSßÍыЫ', 83, 'KeyS'],
    ['dD∂ÎвВ', 68, 'KeyD'],
    ['fFƒÏаА', 70, 'KeyF'],
    ['gG©˝пП', 71, 'KeyG'],
    ['hH˙ÓрР', 72, 'KeyH'],
    ['jJ∆ÔоО', 74, 'KeyJ'],
    ['kK˚лЛ', 75, 'KeyK'],
    ['lL¬ÒдД', 76, 'KeyL'],
    [';:…ÚжЖ', 186, 'Semicolon'],
    ['\'"æÆэЭ', 222, 'Quote'],
    ['zZΩ¸яЯ', 90, 'KeyZ'],
    ['xX≈˛чЧ', 88, 'KeyX'],
    ['cCçÇсС', 67, 'KeyC'],
    ['vV√◊мМ', 86, 'KeyV'],
    ['bB∫ıиИ', 66, 'KeyB'],
    ['nN˜˜тТ', 78, 'KeyN'],
    ['mMµÂьЬ', 77, 'KeyM'],
    [',<≤¯бБ', 188, 'Comma'],
    ['.>≥˘юЮ', 190, 'Period'],
    ['/?÷¿ёЁ', 191, 'Slash'],
];

const charToKeySpec = new Map<string, KeySpec>();

for (const key of keyDescriptions) {
    const [chars, keyCode, code] = key;
    for (const char of chars) {
        charToKeySpec.set(char, {
            text: char,
            key: chars[0],
            code,
            keyCode,
        });
    }
}

export function lookupKey(char: string): KeySpec {
    return (
        charToKeySpec.get(char) || {
            text: char,
            key: char,
            code: 'KeyQ',
            keyCode: 81,
        }
    );
}

export interface KeySpec {
    text: string;
    key: string;
    code: string;
    keyCode: number;
}
