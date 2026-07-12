/**
 * Bilingual copy for the guide site.
 *
 * The Hindi titles/subtitles are the same ones burned into the videos
 * (`src/narration.ts`) so the page and the video never disagree. The English is
 * written for this site only — the videos themselves are Hindi-narrated, which
 * the English copy says out loud rather than pretending otherwise.
 *
 * `chapters` is keyed by the scene id in narration.ts. `scripts/media.mjs`
 * measures each scene's voiceover to turn these into seekable timestamps, so a
 * key that doesn't match a scene id is dropped on the floor — keep them in sync.
 */

/** Shell + player strings. Every user-visible string on the site lives here. */
export const UI = {
  hi: {
    brand: 'Dealer Kavach',
    siteTitle: 'सीखें',
    tagline: 'छोटे-छोटे वीडियो — अपनी भाषा में, आराम से देखिए।',
    metaDescription:
      'Dealer Kavach ऐप चलाना सीखिए — हिंदी में आसान वीडियो। लॉगिन, योद्धा जोड़ना, पॉइंट देना, जमा करना और पॉइंट का हिसाब।',
    langName: 'English',
    langSwitchLabel: 'Read in English',
    watch: 'देखें',
    videoCount: (n) => `${n} वीडियो`,
    minutesShort: 'मिनट',
    step: 'भाग',
    chapters: 'वीडियो में क्या-क्या है',
    quality: 'वीडियो की क्वालिटी',
    qualityLow: 'कम डेटा',
    qualityLowHint: 'धीमे इंटरनेट के लिए',
    qualityHigh: 'साफ़',
    qualityHighHint: 'ज़्यादा डेटा लगेगा',
    download: 'फ़ोन में सेव करें',
    downloadHint: 'एक बार सेव कर लीजिए — फिर बिना इंटरनेट के भी देख सकते हैं।',
    back: 'सारे वीडियो',
    next: 'अगला वीडियो',
    prev: 'पिछला वीडियो',
    dataNote: 'धीमा इंटरनेट मिला — कम डेटा वाली क्वालिटी चालू कर दी है।',
    footer: 'MDG Services',
    hindiAudio: 'आवाज़: हिंदी',
    playHint: 'वीडियो तभी चलेगा जब आप दबाएँगे — तब तक डेटा नहीं लगेगा।',
  },
  en: {
    brand: 'Dealer Kavach',
    siteTitle: 'Learn',
    tagline: 'Short videos that walk you through the app, one task at a time.',
    metaDescription:
      'Learn to use the Dealer Kavach app — short, voice-guided videos covering login, adding warriors, giving and submitting points, and how points are calculated.',
    langName: 'हिंदी',
    langSwitchLabel: 'हिंदी में पढ़ें',
    watch: 'Watch',
    videoCount: (n) => `${n} videos`,
    minutesShort: 'min',
    step: 'Part',
    chapters: "What's in this video",
    quality: 'Video quality',
    qualityLow: 'Data saver',
    qualityLowHint: 'Best on slow connections',
    qualityHigh: 'Clear',
    qualityHighHint: 'Uses more data',
    download: 'Save to phone',
    downloadHint: 'Save it once and watch later without any internet.',
    back: 'All videos',
    next: 'Next video',
    prev: 'Previous video',
    dataNote: 'Slow connection detected — switched to the data-saver quality.',
    footer: 'MDG Services',
    hindiAudio: 'Narrated in Hindi',
    playHint: 'Nothing downloads until you press play.',
  },
};

export const VIDEOS = [
  {
    id: 'login',
    hi: {
      title: 'MDG ऐप में लॉगिन करना',
      subtitle: 'ईमेल और पासवर्ड से ऐप में आना',
      description:
        'सबसे पहला कदम। ऐप खोलिए, अपना ईमेल और पासवर्ड भरिए, और साइन इन कर लीजिए। वही ईमेल और पासवर्ड डालिए जो MDG सर्विसेज़ ने आपको भेजा है।',
      chapters: {
        intro: 'शुरुआत',
        open: 'ऐप खोलिए',
        email: 'ईमेल भरिए',
        password: 'पासवर्ड भरिए',
        signin: "'साइन इन करें' दबाइए",
        landed: 'आप अंदर आ गए',
        recap: 'दोहराइए',
      },
    },
    en: {
      title: 'Logging in to the app',
      subtitle: 'Getting in with your email and password',
      description:
        'The very first step. Open the app, type the email and password MDG Services sent you, and tap Sign in. That is the whole thing.',
      chapters: {
        intro: 'Introduction',
        open: 'Open the app',
        email: 'Enter your email',
        password: 'Enter your password',
        signin: 'Tap Sign in',
        landed: "You're in",
        recap: 'Recap',
      },
    },
  },
  {
    id: 'add-warrior',
    hi: {
      title: 'नया योद्धा जोड़ना',
      subtitle: 'अपने पंप के लोगों को ऐप में जोड़ना',
      description:
        'योद्धा मतलब आपके पंप पर काम करने वाले लोग। पॉइंट देने से पहले उन्हें ऐप में जोड़ना पड़ता है। बस नाम लिखिए और सेव कर दीजिए — फ़ोन नंबर और काम लिखना ज़रूरी नहीं है।',
      chapters: {
        intro: 'योद्धा किसे कहते हैं',
        open: "'योद्धा और पॉइंट' खोलिए",
        'tap-add': "'योद्धा जोड़ें' दबाइए",
        name: 'नाम लिखिए',
        optional: 'फ़ोन और काम (ज़रूरी नहीं)',
        save: 'सेव करें',
        added: 'योद्धा जुड़ गया',
        recap: 'दोहराइए',
      },
    },
    en: {
      title: 'Adding a warrior',
      subtitle: 'Putting the people at your pump into the app',
      description:
        'A "warrior" is anyone who works at your pump. You add them once, and after that you can give them points. Only the name is required — the phone number and job title are optional.',
      chapters: {
        intro: 'What a warrior is',
        open: 'Open Warriors & Points',
        'tap-add': 'Tap Add warrior',
        name: 'Type the name',
        optional: 'Phone and job (optional)',
        save: 'Save',
        added: 'Warrior added',
        recap: 'Recap',
      },
    },
  },
  {
    id: 'give-points',
    hi: {
      title: 'किसी योद्धा को पॉइंट देना',
      subtitle: 'काम चुनिए और सूची में जोड़िए',
      description:
        'जब कोई योद्धा कोई काम अच्छे से करे, तो उसे पॉइंट दीजिए। ध्यान रहे — पॉइंट तुरंत नहीं मिलते। पहले काम एक सूची में जुड़ता है, और दिन के आख़िर में आप सब कुछ एक साथ जमा करते हैं। इसमें यह भी सीखिए कि "अन्य" वाले काम में क्या किया, यह लिखना क्यों ज़रूरी है।',
      chapters: {
        intro: 'पॉइंट तुरंत नहीं मिलते',
        give: "'पॉइंट दें' दबाइए",
        'pick-worker': 'काम किसने किया?',
        search: 'काम खोजिए',
        'pick-work': 'उन्होंने क्या किया?',
        confirm: 'देख लीजिए (और दिन बदलिए)',
        'other-pick': "'अन्य' वाला काम",
        'other-note': 'लिखना ज़रूरी है',
        'other-filled': 'क्या किया, वह लिख दीजिए',
        add: "'सूची में जोड़ें' दबाइए",
        pending: 'जमा करने के लिए तैयार',
        more: 'दिन भर जोड़ते रहिए',
        recap: 'दोहराइए',
      },
    },
    en: {
      title: 'Giving points to a warrior',
      subtitle: 'Pick the work, add it to the submission',
      description:
        'When a warrior does a job well, give them points for it. Note that points are not awarded on the spot — the work joins a pending list, and you submit everything together at the end of the day. This also covers why the catch-all "Other" work makes you write down what was actually done.',
      chapters: {
        intro: 'Points are not instant',
        give: 'Tap Give points',
        'pick-worker': 'Who did the work?',
        search: 'Search for the work',
        'pick-work': 'What did they do?',
        confirm: 'Check it (and change the day)',
        'other-pick': 'The "Other" work',
        'other-note': 'A description is required',
        'other-filled': 'Write what was done',
        add: 'Tap Add to submission',
        pending: 'Ready to submit',
        more: 'Keep adding all day',
        recap: 'Recap',
      },
    },
  },
  {
    id: 'split-points',
    hi: {
      title: 'एक काम कई लोगों में बाँटना',
      subtitle: 'मिलकर किए काम के पॉइंट बराबर बाँटना',
      description:
        'कभी-कभी एक ही काम दो या तीन लोग मिलकर करते हैं। ऐसे में काम चुनने के बाद बस बाकी लोगों पर भी सही का निशान लगा दीजिए — पॉइंट अपने आप सबमें बराबर बँट जाएँगे, और हर योद्धा का अपना हिस्सा सूची में अलग से दिखेगा।',
      chapters: {
        intro: 'मिलकर किया गया काम',
        give: "'पॉइंट दें' दबाइए",
        'pick-first': 'पहला योद्धा चुनिए',
        'pick-work': 'मिलकर किया काम चुनिए',
        'add-coworkers': 'यह किसने-किसने किया?',
        'split-two': 'दो लोग — आधा-आधा',
        'split-three': 'तीन लोग — तीन हिस्से',
        confirm: "'सूची में जोड़ें' दबाइए",
        done: 'दोनों को बीस-बीस पॉइंट',
        recap: 'दोहराइए',
      },
    },
    en: {
      title: 'Splitting one job between several people',
      subtitle: 'Sharing the points for work done together',
      description:
        'Sometimes two or three people do a job together. Pick the job as usual, then tick everyone who helped — the points split equally between them automatically, and each warrior gets their own line in the pending submission.',
      chapters: {
        intro: 'Work done together',
        give: 'Tap Give points',
        'pick-first': 'Pick the first warrior',
        'pick-work': 'Pick the shared job',
        'add-coworkers': 'Who else did it?',
        'split-two': 'Two people — half each',
        'split-three': 'Three people — three shares',
        confirm: 'Tap Add to submission',
        done: 'Twenty points each',
        recap: 'Recap',
      },
    },
  },
  {
    id: 'submit-points',
    hi: {
      title: 'पॉइंट फ़ाइनल जमा करना',
      subtitle: 'हार्डकॉपी की फोटो के साथ जमा कीजिए',
      description:
        'सबसे ज़रूरी कदम। जब तक आप फ़ाइनल जमा नहीं करेंगे, किसी योद्धा को पॉइंट नहीं मिलेंगे। जमा करते समय उस कागज़ की फोटो लगानी होती है जिस पर काम लिखा है — इसी से कागज़ और ऐप का हिसाब मिलता रहता है।',
      chapters: {
        intro: 'जमा किए बिना पॉइंट नहीं मिलते',
        review: 'सूची देख लीजिए',
        fix: 'ग़लत लाइन हटाइए',
        'tap-submit': "'फ़ाइनल जमा करें' दबाइए",
        'photo-ask': 'हार्डकॉपी फोटो',
        'why-photo': 'फोटो क्यों ज़रूरी है',
        'take-photo': 'फोटो खींचिए',
        'photo-done': 'बटन चालू हो गया',
        submit: 'जमा कीजिए',
        done: 'पॉइंट चढ़ गए',
        recap: 'दोहराइए',
      },
    },
    en: {
      title: 'Submitting the points',
      subtitle: 'Finalise with a photo of the hardcopy',
      description:
        'The step that actually counts. Until you submit, no warrior receives any points. Submitting requires a photo of the paper register the work was written on — that is what keeps the paper and the app in agreement.',
      chapters: {
        intro: 'Nothing counts until you submit',
        review: 'Check the list',
        fix: 'Remove a wrong line',
        'tap-submit': 'Tap Final submit',
        'photo-ask': 'The hardcopy photo',
        'why-photo': 'Why the photo is required',
        'take-photo': 'Take the photo',
        'photo-done': 'The button comes alive',
        submit: 'Submit',
        done: 'Points are on the board',
        recap: 'Recap',
      },
    },
  },
  {
    id: 'points-system',
    hi: {
      title: 'पॉइंट कैसे तय होते हैं',
      subtitle: 'समय, हुनर, मेहनत और ज़िम्मेदारी से',
      description:
        'हर काम एक जैसा नहीं होता — तो पॉइंट भी बराबर नहीं होने चाहिए। हर काम के पॉइंट चार बातों से बनते हैं: समय, हुनर, मेहनत और ज़िम्मेदारी। ये चारों आप खुद अपने हिसाब से बदल सकते हैं, और पॉइंट अपने आप बदल जाएँगे।',
      chapters: {
        intro: 'शुरुआत',
        why: 'हर काम एक जैसा नहीं होता',
        idea: 'मुश्किल काम — ज़्यादा पॉइंट',
        formula: 'चार बातें',
        time: '1. समय',
        skill: '2. हुनर',
        effort: '3. मेहनत',
        resp: '4. ज़िम्मेदारी',
        example: 'उदाहरण: बिजली का काम बनाम पार्किंग',
        configure: 'आप खुद तय कीजिए',
        effect: 'नंबर बदलिए — पॉइंट बदल जाएँगे',
        newwork: 'नया काम जोड़ना',
        recap: 'दोहराइए',
      },
    },
    en: {
      title: 'How points are decided',
      subtitle: 'Time, skill, effort and responsibility',
      description:
        'Not every job is the same, so the points should not be the same either. Each job\'s points are built from four things: time, skill, effort and responsibility. You set those four numbers yourself, and the points recalculate on their own.',
      chapters: {
        intro: 'Introduction',
        why: 'Jobs are not all equal',
        idea: 'Harder work, more points',
        formula: 'The four factors',
        time: '1. Time',
        skill: '2. Skill',
        effort: '3. Effort',
        resp: '4. Responsibility',
        example: 'Example: electrical work vs parking',
        configure: 'You set the numbers',
        effect: 'Change a number, points change',
        newwork: 'Adding a new job',
        recap: 'Recap',
      },
    },
  },
];

export const LANGS = ['hi', 'en'];
export const DEFAULT_LANG = 'hi';
