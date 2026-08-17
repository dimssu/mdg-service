/**
 * Single source of truth for every tutorial.
 *
 * Each scene's `text` is BOTH the on-screen Hindi caption AND the exact script
 * the ElevenLabs voice reads (`npm run voice`). The audio file for a scene is
 * `public/audio/<tutorial id>/<scene id>.mp3`. `step` tells the matching video
 * component which mock-app screen state to draw; `estSeconds` is only a fallback
 * length used until the real voiceover exists (the video auto-resizes to the
 * generated audio — see src/lib/calc.ts).
 *
 * Narration is written in simple, spoken Hindi (Devanagari) for a non-technical
 * audience, and quotes the app's real button labels verbatim.
 */

export interface Scene {
  /** Unique within a tutorial. Also the audio file name. */
  id: string;
  /** Which mock screen state the video draws for this scene. */
  step: string;
  /** Hindi narration — spoken by the voice AND shown as the caption. */
  text: string;
  /** Fallback seconds used before the real voiceover is generated. */
  estSeconds: number;
}

export interface Tutorial {
  /** Composition id (folder name for audio too). */
  id: string;
  /** Remotion composition id (PascalCase, shown in Studio). */
  compositionId: string;
  /** Hindi title shown in the video header. */
  title: string;
  /** One-line Hindi subtitle. */
  subtitle: string;
  scenes: Scene[];
}

const login: Tutorial = {
  id: 'login',
  compositionId: 'Login',
  title: 'MDG ऐप में लॉगिन करना',
  subtitle: 'ईमेल और पासवर्ड से ऐप में आना',
  scenes: [
    {
      id: 'intro',
      step: 'loginBlank',
      text: 'नमस्ते! इस वीडियो में हम सीखेंगे कि MDG ऐप में लॉगिन कैसे करते हैं। बहुत आसान है — बस ध्यान से देखिए।',
      estSeconds: 6.5,
    },
    {
      id: 'open',
      step: 'loginBlank',
      text: 'सबसे पहले अपने मोबाइल में MDG ऐप खोलिए। आपके सामने यह लॉगिन स्क्रीन खुलेगी।',
      estSeconds: 5.5,
    },
    {
      id: 'email',
      step: 'typeEmail',
      text: 'अब सबसे ऊपर वाले खाने में अपना ईमेल भरिए — वही ईमेल जो आपको MDG सर्विसेज़ ने दिया है।',
      estSeconds: 6.5,
    },
    {
      id: 'password',
      step: 'typePassword',
      text: 'उसके नीचे वाले खाने में अपना पासवर्ड भरिए। पासवर्ड भी वही डालें जो MDG ने आपको भेजा है।',
      estSeconds: 6.5,
    },
    {
      id: 'signin',
      step: 'tapSignIn',
      text: "अब नीचे काले रंग के 'साइन इन करें' बटन को दबाइए।",
      estSeconds: 4.5,
    },
    {
      id: 'landed',
      step: 'loggedIn',
      text: 'बस, हो गया! अब आप ऐप के अंदर आ गए हैं। यहाँ से आप MDG टीम से बात कर सकते हैं और बाकी सारे काम कर सकते हैं।',
      estSeconds: 7.5,
    },
    {
      id: 'recap',
      step: 'loginBlank',
      text: "याद रखिए — ईमेल भरें, पासवर्ड भरें, और 'साइन इन करें' दबाएँ। अगर लॉगिन न हो, तो एक बार फिर ध्यान से कोशिश कीजिए या MDG से संपर्क कीजिए।",
      estSeconds: 8.5,
    },
  ],
};

const addWarrior: Tutorial = {
  id: 'add-warrior',
  compositionId: 'AddWarrior',
  title: 'नया योद्धा जोड़ना',
  subtitle: 'अपने पंप के लोगों को ऐप में जोड़ना',
  scenes: [
    {
      id: 'intro',
      step: 'staffEmpty',
      text: "इस वीडियो में हम सीखेंगे कि अपने 'योद्धा' को ऐप में कैसे जोड़ते हैं। योद्धा मतलब आपके पंप पर काम करने वाले लोग।",
      estSeconds: 8.5,
    },
    {
      id: 'open',
      step: 'staffEmpty',
      text: "सबसे पहले 'योद्धा और पॉइंट' वाली स्क्रीन खोलिए। अगर अभी तक कोई योद्धा नहीं जुड़ा है, तो यहाँ 'योद्धा जोड़ें' का बटन दिखेगा।",
      estSeconds: 8.5,
    },
    {
      id: 'tap-add',
      step: 'tapAdd',
      text: "उस 'योद्धा जोड़ें' बटन को दबाइए।",
      estSeconds: 4,
    },
    {
      id: 'name',
      step: 'typeName',
      text: "अब एक छोटा सा फ़ॉर्म खुलेगा। सबसे पहले खाने में योद्धा का नाम लिखिए — जैसे 'रमेश'।",
      estSeconds: 6.5,
    },
    {
      id: 'optional',
      step: 'optionalFields',
      text: 'अगर आप चाहें तो नीचे उनका फ़ोन नंबर और उनका काम या पद भी लिख सकते हैं। यह ज़रूरी नहीं है — इसे छोड़ भी सकते हैं।',
      estSeconds: 7.5,
    },
    {
      id: 'save',
      step: 'tapSave',
      text: "अब नीचे 'योद्धा सेव करें' बटन दबाइए।",
      estSeconds: 4,
    },
    {
      id: 'added',
      step: 'staffWithOne',
      text: 'शाबाश! आपका योद्धा जुड़ गया। अब उसका नाम सूची में दिखेगा और आप उसे पॉइंट दे सकते हैं।',
      estSeconds: 7,
    },
    {
      id: 'recap',
      step: 'staffWithOne',
      text: "इसी तरह आप जितने चाहें उतने योद्धा जोड़ सकते हैं — बस 'योद्धा जोड़ें' दबाएँ, नाम लिखें, और सेव करें।",
      estSeconds: 7.5,
    },
  ],
};

const givePoints: Tutorial = {
  id: 'give-points',
  compositionId: 'GivePoints',
  title: 'किसी योद्धा को पॉइंट देना',
  subtitle: 'काम चुनिए और सूची में जोड़िए',
  scenes: [
    {
      id: 'intro',
      step: 'staffHome',
      text: 'जब कोई योद्धा कोई काम अच्छे से करे, तो आप उसे पॉइंट दे सकते हैं। एक ज़रूरी बात — पॉइंट तुरंत नहीं मिलते। पहले वे एक सूची में जुड़ते हैं, और दिन के आख़िर में आप उन्हें एक साथ जमा करते हैं।',
      estSeconds: 11,
    },
    {
      id: 'give',
      step: 'tapGive',
      text: "'योद्धा और पॉइंट' स्क्रीन पर सबसे ऊपर काले रंग का बड़ा बटन है — 'पॉइंट दें'। उसे दबाइए।",
      estSeconds: 6.5,
    },
    {
      id: 'pick-worker',
      step: 'sheetPickWorker',
      text: "अब पूछा जाएगा 'काम किसने किया?'। जिस योद्धा ने काम किया है, उसके नाम पर एक बार दबाइए। जैसे — रमेश ने किया।",
      estSeconds: 8,
    },
    {
      id: 'search',
      step: 'sheetSearch',
      text: 'अब कामों की पूरी सूची खुलेगी। ऊपर खोजने का खाना है — काम का नाम लिखकर उसे तुरंत ढूँढ सकते हैं। सूची में नीचे तक जाने की ज़रूरत नहीं।',
      estSeconds: 9.5,
    },
    {
      id: 'pick-work',
      step: 'sheetPickWork',
      text: "जो काम उसने किया, उसके आगे सही का निशान लगाइए — जैसे 'डी-यू आईलैंड की सफाई'। एक से ज़्यादा काम भी चुन सकते हैं। फिर नीचे 'आगे बढ़ें' दबाइए।",
      estSeconds: 10,
    },
    {
      id: 'confirm',
      step: 'sheetConfirm',
      text: 'अब आख़िरी स्क्रीन पर देख लीजिए — किसने क्या किया और कितने पॉइंट बनेंगे। यहाँ आप दिन भी बदल सकते हैं, अगर काम कल का है।',
      estSeconds: 9.5,
    },
    {
      id: 'other-pick',
      step: 'sheetOtherEmpty',
      text: "एक ख़ास बात। सूची में एक काम है — 'अन्य सफाई से जुड़ा काम'। यह उन कामों के लिए है जो सूची में नहीं मिले।",
      estSeconds: 9,
    },
    {
      id: 'other-note',
      step: 'sheetOtherError',
      text: "इस काम में यह लिखना ज़रूरी है कि असल में क्या किया। बिना लिखे 'सूची में जोड़ें' नहीं दबेगा — लाल रंग में चेतावनी आ जाएगी।",
      estSeconds: 10,
    },
    {
      id: 'other-filled',
      step: 'sheetOtherFilled',
      text: "तो साफ़-साफ़ लिख दीजिए — जैसे 'छत की सफाई की'। अब यह काम भी जुड़ सकता है।",
      estSeconds: 7.5,
    },
    {
      id: 'add',
      step: 'sheetAddPressed',
      text: "सब ठीक हो तो नीचे 'सूची में जोड़ें' दबाइए। ध्यान दीजिए — यहाँ 'पॉइंट दें' नहीं लिखा, 'सूची में जोड़ें' लिखा है।",
      estSeconds: 9,
    },
    {
      id: 'pending',
      step: 'draftOne',
      text: "देखिए, स्क्रीन पर एक नया डिब्बा आ गया — 'जमा करने के लिए तैयार'। रमेश का काम इसमें जुड़ गया है। यह अपने आप सेव भी हो जाता है।",
      estSeconds: 10,
    },
    {
      id: 'more',
      step: 'draftTwo',
      text: 'दिन भर आप ऐसे ही और काम जोड़ते रहिए। सबका हिसाब इसी सूची में जुड़ता जाएगा — हर योद्धा का अलग-अलग।',
      estSeconds: 8.5,
    },
    {
      id: 'recap',
      step: 'draftTwo',
      text: "याद रखिए — 'पॉइंट दें' दबाएँ, योद्धा चुनें, काम चुनें, और 'सूची में जोड़ें' दबाएँ। पॉइंट कैसे जमा करने हैं, यह अगले वीडियो में सीखेंगे।",
      estSeconds: 10,
    },
  ],
};

const splitPoints: Tutorial = {
  id: 'split-points',
  compositionId: 'SplitPoints',
  title: 'एक काम कई लोगों में बाँटना',
  subtitle: 'मिलकर किए काम के पॉइंट बराबर बाँटना',
  scenes: [
    {
      id: 'intro',
      step: 'staffHome',
      text: 'कभी-कभी एक ही काम दो या तीन लोग मिलकर करते हैं। ऐसे में पॉइंट उन सबमें बराबर बाँटे जा सकते हैं। आइए देखते हैं कैसे।',
      estSeconds: 7.5,
    },
    {
      id: 'give',
      step: 'tapGive',
      text: "पहले की तरह सबसे ऊपर 'पॉइंट दें' बटन दबाइए।",
      estSeconds: 4.5,
    },
    {
      id: 'pick-first',
      step: 'sheetPickWorker',
      text: "'काम किसने किया?' — किसी एक योद्धा को चुनिए जिसने काम किया। बाकी लोगों को हम अगले कदम में जोड़ेंगे। मान लीजिए पहले रमेश को चुना।",
      estSeconds: 9,
    },
    {
      id: 'pick-work',
      step: 'sheetPickSplitWork',
      text: "अब वह काम चुनिए जो मिलकर किया गया — जैसे 'सेल्स बिल्डिंग और ड्राइव-वे की सफाई'। इस पर पूरे चालीस पॉइंट हैं। उसे चुनकर 'आगे बढ़ें' दबाइए।",
      estSeconds: 9.5,
    },
    {
      id: 'add-coworkers',
      step: 'sheetAddCoworkers',
      text: "अब सबसे ज़रूरी कदम। ऊपर लिखा है 'यह किसने-किसने किया?'। यहाँ उन सभी लोगों पर सही का निशान लगाइए जिन्होंने यह काम साथ में किया। जैसे रमेश के साथ सुरेश ने भी किया — तो सुरेश को भी चुनिए।",
      estSeconds: 11,
    },
    {
      id: 'split-two',
      step: 'sheetSplitTwo',
      text: "ध्यान दीजिए — जैसे ही आपने दो लोग चुने, चालीस पॉइंट अपने आप बराबर बँट गए। अब हर एक को बीस-बीस पॉइंट मिलेंगे। नीचे लिखा भी आएगा 'सबके बीच बँटेगा'।",
      estSeconds: 9.5,
    },
    {
      id: 'split-three',
      step: 'sheetSplitThree',
      text: 'अगर तीन लोग मिलकर करते, तो वही चालीस पॉइंट तीन में बँट जाते — हर एक को लगभग तेरह पॉइंट। आप जितने लोग चुनेंगे, उतने में बराबर बँट जाएगा।',
      estSeconds: 9,
    },
    {
      id: 'confirm',
      step: 'sheetConfirmSplit',
      text: "सब लोग चुन लेने के बाद नीचे 'सूची में जोड़ें' दबाइए।",
      estSeconds: 5.5,
    },
    {
      id: 'done',
      step: 'draftSplit',
      text: 'हो गया! सूची में अब दोनों योद्धाओं के नाम अलग-अलग आ गए — और दोनों के बीस-बीस पॉइंट। यही है एक काम को कई लोगों में बाँटना।',
      estSeconds: 9.5,
    },
    {
      id: 'recap',
      step: 'draftSplit',
      text: "याद रखिए — 'पॉइंट दें', एक योद्धा चुनें, काम चुनें, फिर 'यह किसने-किसने किया?' में बाकी लोगों को चुनें — पॉइंट अपने आप बराबर बँट जाएँगे।",
      estSeconds: 9,
    },
  ],
};

const pointsSystem: Tutorial = {
  id: 'points-system',
  compositionId: 'PointsSystem',
  title: 'पॉइंट कैसे तय होते हैं',
  subtitle: 'समय, हुनर, मेहनत और ज़िम्मेदारी से',
  scenes: [
    {
      id: 'intro',
      step: 'title',
      text: 'नमस्ते! इस वीडियो में हम आसान भाषा में समझेंगे कि हर काम के पॉइंट कैसे तय होते हैं — और आप उन्हें अपने हिसाब से कैसे बदल सकते हैं।',
      estSeconds: 8.5,
    },
    {
      id: 'why',
      step: 'problem',
      text: 'हर काम एक जैसा नहीं होता। किसी में ज़्यादा समय लगता है, किसी में ज़्यादा हुनर। जैसे बिजली का काम मुश्किल है, और गाड़ी पार्क कराना आसान। तो दोनों के पॉइंट बराबर देना ठीक नहीं।',
      estSeconds: 10,
    },
    {
      id: 'idea',
      step: 'idea',
      text: 'इसलिए हर काम के पॉइंट उसकी मेहनत के हिसाब से तय होते हैं। जो योद्धा मुश्किल काम करेगा, उसे ज़्यादा पॉइंट अपने-आप मिलेंगे। यही इसका सबसे बड़ा फ़ायदा है।',
      estSeconds: 9.5,
    },
    {
      id: 'formula',
      step: 'formula',
      text: 'पॉइंट तय करने के लिए हम चार बातें देखते हैं — समय, हुनर, मेहनत, और ज़िम्मेदारी। इन्हीं चारों से हर काम के पॉइंट बनते हैं।',
      estSeconds: 9,
    },
    {
      id: 'time',
      step: 'time',
      text: 'पहली बात — समय। काम में जितने मिनट लगते हैं, काम उतना बड़ा। तीस मिनट का काम, पाँच मिनट के काम से बड़ा है।',
      estSeconds: 8,
    },
    {
      id: 'skill',
      step: 'skill',
      text: 'दूसरी बात — हुनर। काम में कितनी कारीगरी और समझ चाहिए। इसे आप शून्य से सौ तक के नंबर में भरते हैं। जितना ज़्यादा हुनर, उतने ज़्यादा पॉइंट।',
      estSeconds: 9.5,
    },
    {
      id: 'effort',
      step: 'effort',
      text: 'तीसरी बात — मेहनत। यानी काम कितना भारी, गंदा या थका देने वाला है। इसे भी आप शून्य से सौ तक भरते हैं।',
      estSeconds: 8.5,
    },
    {
      id: 'resp',
      step: 'resp',
      text: 'चौथी बात — ज़िम्मेदारी। अगर काम में गलती से बड़ा नुकसान हो सकता है — जैसे पैसा या सुरक्षा — तो ज़िम्मेदारी ज़्यादा। इसे भी शून्य से सौ तक भरते हैं।',
      estSeconds: 10,
    },
    {
      id: 'example',
      step: 'example',
      text: 'एक उदाहरण देखिए। बिजली का काम — समय भी लगता है, हुनर भी ज़्यादा, ज़िम्मेदारी भी। इसके पूरे पंद्रह पॉइंट। और गाड़ी पार्क कराना — आसान काम, बस आधा पॉइंट। फ़र्क साफ़ दिखता है।',
      estSeconds: 11,
    },
    {
      id: 'configure',
      step: 'configure',
      text: 'अब सबसे काम की बात — ये आप खुद तय कर सकते हैं। हर काम के लिए चार खाने हैं। जैसे टॉयलेट की सफ़ाई — समय साठ मिनट, हुनर कम, मेहनत ज़्यादा, ज़िम्मेदारी थोड़ी। भरते ही पॉइंट बन जाते हैं — सत्रह।',
      estSeconds: 12,
    },
    {
      id: 'effect',
      step: 'effect',
      text: 'अब मान लीजिए आपको लगता है टॉयलेट की सफ़ाई में ज़िम्मेदारी ज़्यादा है। बस उसका नंबर बढ़ा दीजिए — और देखिए, पॉइंट सत्रह से बढ़कर तेईस हो गए। घटाएँगे तो घट जाएँगे।',
      estSeconds: 11,
    },
    {
      id: 'newwork',
      step: 'newwork',
      text: 'और जब आप कोई नया काम जोड़ेंगे, तो यही चार बातें भरनी होंगी। इससे हर नए काम के पॉइंट भी सही और बराबरी से तय होते हैं।',
      estSeconds: 8.5,
    },
    {
      id: 'recap',
      step: 'recap',
      text: 'याद रखिए — चार बातें: समय, हुनर, मेहनत, और ज़िम्मेदारी। इन्हीं से हर काम के पॉइंट बनते हैं, और आप इन्हें कभी भी बदल सकते हैं। धन्यवाद!',
      estSeconds: 9.5,
    },
  ],
};

const submitPoints: Tutorial = {
  id: 'submit-points',
  compositionId: 'SubmitPoints',
  title: 'पॉइंट फ़ाइनल जमा करना',
  subtitle: 'हार्डकॉपी की फोटो के साथ जमा कीजिए',
  scenes: [
    {
      id: 'intro',
      step: 'draftFull',
      text: 'दिन भर आपने जो काम सूची में जोड़े, अब उन्हें फ़ाइनल जमा करना है। याद रखिए — जब तक आप जमा नहीं करेंगे, किसी योद्धा को पॉइंट नहीं मिलेंगे।',
      estSeconds: 10,
    },
    {
      id: 'review',
      step: 'draftFull',
      text: "'जमा करने के लिए तैयार' वाले डिब्बे में सब कुछ दिख रहा है — किस योद्धा ने क्या किया, और कितने पॉइंट। एक बार ध्यान से देख लीजिए।",
      estSeconds: 9.5,
    },
    {
      id: 'fix',
      step: 'draftRemove',
      text: 'अगर कुछ ग़लत जुड़ गया है, तो उसके आगे कूड़ेदान के निशान को दबाकर हटा सकते हैं। जमा करने से पहले जितनी बार चाहें बदल सकते हैं।',
      estSeconds: 9.5,
    },
    {
      id: 'tap-submit',
      step: 'draftSubmitPressed',
      text: "सब ठीक लगे तो सबसे नीचे 'फ़ाइनल जमा करें' बटन दबाइए।",
      estSeconds: 5.5,
    },
    {
      id: 'photo-ask',
      step: 'finalizeEmpty',
      text: 'अब एक नई विंडो खुलेगी जो हार्डकॉपी की फोटो माँगेगी। यानी जिस कागज़ पर आपने काम लिखा है, उसकी फोटो।',
      estSeconds: 9,
    },
    {
      id: 'why-photo',
      step: 'finalizeEmpty',
      text: 'यह फोटो ज़रूरी है। इससे कागज़ और ऐप का हिसाब हमेशा मिलता रहता है, और बाद में कोई शक-शुबहा नहीं रहता। फोटो के बिना जमा का बटन नहीं दबेगा।',
      estSeconds: 11,
    },
    {
      id: 'take-photo',
      step: 'finalizePhotoTap',
      text: "'फोटो खींचें' दबाइए और कागज़ की फोटो ले लीजिए।",
      estSeconds: 5,
    },
    {
      id: 'photo-done',
      step: 'finalizePhoto',
      text: 'फोटो लग गई। अब देखिए, नीचे वाला जमा का बटन चालू हो गया है।',
      estSeconds: 6.5,
    },
    {
      id: 'submit',
      step: 'finalizeSubmitPressed',
      text: 'अब जमा करने वाला बटन दबाइए।',
      estSeconds: 4,
    },
    {
      id: 'done',
      step: 'submitted',
      text: 'बधाई हो! पॉइंट जमा हो गए। अब सबकी सूची में पॉइंट चढ़ गए हैं और सूची वाला डिब्बा ख़ाली हो गया।',
      estSeconds: 8.5,
    },
    {
      id: 'recap',
      step: 'submitted',
      text: 'याद रखिए — दिन भर काम जोड़िए, फिर एक बार फ़ाइनल जमा कीजिए, हार्डकॉपी की फोटो के साथ। तभी पॉइंट पक्के होते हैं। धन्यवाद!',
      estSeconds: 10,
    },
  ],
};

/**
 * CreditMonitor — a concept explainer (not an app walkthrough) that reads the
 * daily "CREDIT & DOD MONITORING" card MDG sends each dealer, line by line, in
 * simple Hindi. Each scene's `step` selects a card state + which row to ring:
 *   card-full → whole card, no ring (intro/overview)
 *   <field>   → the due-state card with that row highlighted
 *   advance   → the credit/advance-state card (negative DUE AMOUNT, no due date)
 *   act/recap → practical takeaways
 * The same narration drives BOTH the clean recreation (CreditMonitor) and the
 * marked-up-photo version (CreditMonitorPhoto), so the voice is generated once.
 */
const creditMonitor: Tutorial = {
  id: 'credit-monitor',
  compositionId: 'CreditMonitor',
  title: 'क्रेडिट और DOD मॉनिटरिंग',
  subtitle: 'अपना रोज़ का उधार-हिसाब कार्ड पढ़ना सीखिए',
  scenes: [
    {
      id: 'intro',
      step: 'card-full',
      text: 'नमस्ते! हर रोज़ MDG की तरफ़ से आपको यह "क्रेडिट और DOD मॉनिटरिंग" कार्ड मिलता है। इस वीडियो में हम इसे एक-एक लाइन करके, आसान भाषा में समझेंगे।',
      estSeconds: 9,
    },
    {
      id: 'overview',
      step: 'card-full',
      text: 'यह कार्ड एक ही नज़र में बता देता है कि इंडियन ऑयल के साथ आपके उधार का हिसाब कैसा है — कितना बकाया है, कितनी सीमा है, और कितना अभी बाकी है। ऊपर से नीचे, बारी-बारी देखते हैं।',
      estSeconds: 11,
    },
    {
      id: 'due-amount',
      step: 'due-amount',
      text: 'सबसे ऊपर है DUE AMOUNT — यानी बकाया राशि। यह वह पैसा है जो आपको इंडियन ऑयल के खाते में जमा करना है।',
      estSeconds: 8,
    },
    {
      id: 'due-date',
      step: 'due-date',
      text: 'उसी के साथ, दाहिनी तरफ़ DUE DATE — यानी आख़िरी तारीख़। इसी तारीख़ तक बकाया राशि जमा करनी होती है। नीचे यह भी लिखा रहता है कि कितने दिन बाक़ी हैं। देर हुई तो सप्लाई रुक सकती है।',
      estSeconds: 12,
    },
    {
      id: 'current-limit',
      step: 'current-limit',
      text: 'फिर आता है CURRENT LIMIT — आपकी कुल उधार सीमा। यानी आज के लिए तय की गई राशि, जितने तक आप माल उठा सकते हैं।',
      estSeconds: 9,
    },
    {
      id: 'availed-limit',
      step: 'availed-limit',
      text: 'AVAILED LIMIT — अभी तक की गई खपत। यानी इस सीमा में से आप अब तक कितना इस्तेमाल कर चुके हैं।',
      estSeconds: 8,
    },
    {
      id: 'available-limit',
      step: 'available-limit',
      text: 'AVAILABLE LIMIT — बची हुई राशि। यानी अभी आप और कितने का माल उठा सकते हैं। हिसाब आसान है — कुल सीमा में से की गई खपत घटा दीजिए।',
      estSeconds: 10,
    },
    {
      id: 'form-of-limit',
      step: 'form-of-limit',
      text: 'FORM OF LIMIT बताता है कि आपकी सीमा किस तरह की है। कार्ड पर तीनों नाम दिखते हैं — DOD, क्रेडिट, और कैश एंड कैरी — पर जो आपकी है वही गहरे रंग में हाइलाइट रहती है। एक समय में सिर्फ़ एक ही चलती है।',
      estSeconds: 13,
    },
    {
      id: 'prepared-at',
      step: 'prepared-at',
      text: 'सबसे नीचे Data Prepared At — यानी यह हिसाब किस समय बनाया गया। हमेशा ताज़ा समय देखकर ही भरोसा कीजिए।',
      estSeconds: 8,
    },
    {
      id: 'advance',
      step: 'advance',
      text: 'अब एक और स्थिति देखिए। कभी ऊपर लाल की जगह हरा रंग आ जाता है और लिखा होता है ADVANCE — साथ में DUE DATE की जगह "कुछ नहीं"। इसका मतलब — कोई बकाया नहीं। आपने पहले ही ज़्यादा पैसा जमा कर रखा है, यानी आप एडवांस में हैं।',
      estSeconds: 14,
    },
    {
      id: 'act',
      step: 'act',
      text: 'तो हर रोज़ यही देखिए — अगर बकाया है तो तारीख़ से पहले जमा कर दीजिए, और AVAILABLE LIMIT देखकर तय कीजिए कि अभी और कितने का माल उठाया जा सकता है।',
      estSeconds: 10.5,
    },
    {
      id: 'recap',
      step: 'recap',
      text: 'बस इतना ही! सबसे ऊपर बकाया और तारीख़, उसके नीचे तीनों सीमाएँ और खपत की पट्टी, फिर किस तरह की सीमा है, और आख़िर में हिसाब का समय। रोज़ एक नज़र डालिए और अपना हिसाब हमेशा साफ़ रखिए। धन्यवाद!',
      estSeconds: 14,
    },
  ],
};

/**
 * AdminCreditDod — the first ADMIN-facing tutorial in the library. Audience is
 * the MDG ops team, not a dealer, so the on-screen material is the real (English)
 * admin portal and the SDMS portal; only the narration is Hindi. Landscape
 * 1920×1080, because the admin portal is a desktop screen.
 *
 * This one answers "what is this service and where does the number come from?" —
 * the question an admin gets asked back the moment a dealer disputes a figure.
 * Each scene's `step` selects a diagram stage in AdminCreditDodVideo.
 */
const adminCreditDod: Tutorial = {
  id: 'admin-credit-dod',
  compositionId: 'AdminCreditDod',
  title: 'Credit & DOD Monitoring — यह सर्विस क्या करती है',
  subtitle: 'MDG एडमिन टीम के लिए — रिपोर्ट का नंबर कहाँ से आता है',
  scenes: [
    {
      id: 'intro',
      step: 'intro',
      text: 'नमस्ते! यह वीडियो MDG की एडमिन टीम के लिए है। इसमें हम समझेंगे कि Credit और DOD Monitoring सर्विस असल में करती क्या है, और रिपोर्ट में दिखने वाला नंबर कहाँ से आता है।',
      estSeconds: 12,
    },
    {
      id: 'problem',
      step: 'problem',
      text: 'डीलर का रोज़ का सवाल सिर्फ़ दो हैं — कितना पैसा जमा करना है, और कब तक। इंडियन ऑयल का पोर्टल यह सीधे नहीं बताता। हमें यह ख़ुद निकालना पड़ता है।',
      estSeconds: 11,
    },
    {
      id: 'login',
      step: 'login',
      text: 'हर रिपोर्ट एक असली लॉगिन है। सिस्टम डीलर के SDMS खाते में लॉगिन करता है — कैप्चा हमारा OCR ख़ुद पढ़ता है। इसीलिए एक रिपोर्ट बनने में क़रीब एक मिनट लगता है।',
      estSeconds: 12,
    },
    {
      id: 'two-pages',
      step: 'two-pages',
      text: 'पोर्टल से हम दो पन्ने उठाते हैं। पहला — Credit Monitoring, जहाँ से Current Credit Limit और Current Total Receivable मिलते हैं। दूसरा — PAD Statement, यानी पूरा लेन-देन का खाता।',
      estSeconds: 13,
    },
    {
      id: 'ledger',
      step: 'ledger',
      text: 'PAD Statement में हर लाइन या तो ख़रीद है या भुगतान। ख़रीद यानी debit — बकाया बढ़ता है। भुगतान यानी credit — बकाया घटता है। यही कच्चा माल है।',
      estSeconds: 12,
    },
    {
      id: 'fifo',
      step: 'fifo',
      text: 'अब असली काम। हम हर ख़रीद को उसकी तारीख़ के साथ एक अलग "लॉट" मानते हैं। जब भुगतान आता है, वह सबसे पुराने लॉट से चुकता होता है — पहले आया, पहले गया। इसे FIFO कहते हैं।',
      estSeconds: 14,
    },
    {
      id: 'due-amount',
      step: 'due-amount',
      text: 'जो सबसे पुराना लॉट अब भी बचा है, उसी की राशि DUE AMOUNT बनती है। यानी अभी जमा करने वाला पैसा पूरा बकाया नहीं, सिर्फ़ सबसे पुरानी ख़रीद का हिस्सा है।',
      estSeconds: 13,
    },
    {
      id: 'due-date',
      step: 'due-date',
      text: 'DUE DATE उसी लॉट की तारीख़ में तीन दिन जोड़कर बनती है। पर अगर वह दिन रविवार, महीने का दूसरा या चौथा शनिवार, या कोई बैंक छुट्टी हो, तो तारीख़ आगे के काम वाले दिन खिसक जाती है।',
      estSeconds: 15,
    },
    {
      id: 'reconcile',
      step: 'reconcile',
      text: 'हर बार सिस्टम अपनी गिनती को SDMS के अपने Current Total Receivable से मिलाता है। मिल गया तो हरा "Reconciles" दिखता है। न मिले तो लाल — और ऐसी रिपोर्ट डीलर को भेजने से पहले टीम को दिखाइए।',
      estSeconds: 15,
    },
    {
      id: 'card',
      step: 'card',
      text: 'यही सब मिलकर वह कार्ड बनाते हैं जो डीलर को मिलता है — ऊपर बकाया और तारीख़, बीच में सीमा और खपत, नीचे किस तरह की सीमा है।',
      estSeconds: 11,
    },
    {
      id: 'approval',
      step: 'approval',
      text: 'सबसे ज़रूरी बात — रिपोर्ट अपने आप डीलर को नहीं जाती। बनती है, रुकती है, और तभी जाती है जब कोई एडमिन देखकर "Share with dealer" दबाता है।',
      estSeconds: 12,
    },
    {
      id: 'recap',
      step: 'recap',
      text: 'संक्षेप में — पोर्टल से खाता उठाओ, FIFO से सबसे पुरानी बकाया ख़रीद निकालो, तीन काम के दिन जोड़कर तारीख़ बनाओ, SDMS से मिलान करो, और एडमिन की मंज़ूरी के बाद ही भेजो। अगले वीडियो में हम यही काम पोर्टल पर करके देखेंगे।',
      estSeconds: 16,
    },
  ],
};

/**
 * AdminCreditDodPortal — the hands-on twin: the same feature, driven through the
 * admin portal screen by screen. `step` selects which mocked admin screen (and
 * which highlight on it) AdminCreditDodPortalVideo draws.
 */
const adminCreditDodPortal: Tutorial = {
  id: 'admin-credit-dod-portal',
  compositionId: 'AdminCreditDodPortal',
  title: 'एडमिन पोर्टल में Credit & DOD चलाना',
  subtitle: 'रिपोर्ट बनाना, जाँचना और डीलर को भेजना',
  scenes: [
    {
      id: 'intro',
      step: 'intro',
      text: 'अब हम यही काम एडमिन पोर्टल पर करके देखेंगे — रिपोर्ट बनाना, उसे जाँचना, और डीलर तक भेजना।',
      estSeconds: 9,
    },
    {
      id: 'open-tab',
      step: 'open-tab',
      text: 'बाएँ मेन्यू से Dealers खोलिए, अपना डीलर चुनिए, और ऊपर की पट्टी में "Credit & DOD" टैब पर जाइए। पूरा काम इसी एक टैब पर होता है।',
      estSeconds: 12,
    },
    {
      id: 'generate',
      step: 'generate',
      text: 'सबसे ऊपर है Generate। "Today" चुनकर "Generate now" दबाइए — यह आज तक का ताज़ा हिसाब बनाएगा। "Past date" वाला टैब किसी पुरानी तारीख़ की रिपोर्ट दोबारा बना देता है।',
      estSeconds: 14,
    },
    {
      id: 'quota',
      step: 'quota',
      text: 'ध्यान रहे — एक डीलर के लिए एक घंटे में सिर्फ़ तीन बार रिपोर्ट बनाई जा सकती है। कार्ड के नीचे लिखा रहता है कि कितनी बची हैं। बार-बार लॉगिन करने से डीलर का पोर्टल खाता लॉक हो सकता है, इसलिए यह रोक ज़रूरी है।',
      estSeconds: 16,
    },
    {
      id: 'wait',
      step: 'wait',
      text: 'दबाने के बाद क़रीब एक मिनट लगता है। इस बीच सिस्टम लॉगिन करता है, कैप्चा हल करता है, दोनों पन्ने पढ़ता है और कार्ड बनाता है। तैयार होते ही नीचे Report history में सबसे ऊपर आ जाता है।',
      estSeconds: 15,
    },
    {
      id: 'history',
      step: 'history',
      text: 'Report history इस डीलर की सारी पुरानी रिपोर्ट रखती है। सबसे नई अपने आप खुली रहती है। किसी भी लाइन पर दबाइए और वह रिपोर्ट पूरी खुल जाएगी — कहीं और जाने की ज़रूरत नहीं।',
      estSeconds: 14,
    },
    {
      id: 'review',
      step: 'review',
      text: 'भेजने से पहले तीन चीज़ें देखिए। एक — हरा "Reconciles"। दो — कोई पीली चेतावनी तो नहीं, जैसे "due date is an estimate"। तीन — "Why this amount?" खोलकर देख लीजिए कि नंबर किन ख़रीदों से बना है।',
      estSeconds: 17,
    },
    {
      id: 'sources',
      step: 'sources',
      text: 'नीचे Source files में PAD statement मिलता है — पूरा खाता, पढ़ने लायक़ बना हुआ। डीलर बहस करे तो यही फ़ाइल खोलकर लाइन-दर-लाइन दिखाई जा सकती है।',
      estSeconds: 13,
    },
    {
      id: 'share',
      step: 'share',
      text: 'सब ठीक लगे तो "Share with dealer" दबाइए। एक पुष्टि आएगी — हाँ करते ही कार्ड डीलर की चैट में चला जाता है और उसे नोटिफ़िकेशन भी मिल जाता है।',
      estSeconds: 13,
    },
    {
      id: 'shared',
      step: 'shared',
      text: 'भेजने के बाद वही लाइन "Shared" दिखाने लगती है, समय के साथ। दोबारा दबाने पर डीलर को दूसरा संदेश नहीं जाएगा — एक रिपोर्ट सिर्फ़ एक बार जाती है।',
      estSeconds: 13,
    },
    {
      id: 'failed',
      step: 'failed',
      text: 'अगर रन फ़ेल हो जाए तो घबराइए मत। उसी डीलर के "Run history" टैब में जाइए — वहाँ साफ़ भाषा में लिखा रहता है कि क्या ग़लत हुआ और अब क्या करना है, जैसे पासवर्ड बदल गया हो।',
      estSeconds: 15,
    },
    {
      id: 'recap',
      step: 'recap',
      text: 'तो पूरा तरीक़ा यही है — टैब खोलिए, Generate now दबाइए, एक मिनट रुकिए, Report history में जाँचिए, और फिर Share with dealer। धन्यवाद!',
      estSeconds: 13,
    },
  ],
};

/**
 * AdminDsrReceipts — the DSR's one hand-editable input.
 *
 * Half concept, half walkthrough on purpose: an admin cannot use the correction
 * safely without first knowing WHY the portal's receipt is untrustworthy and
 * WHAT a change to it invalidates. Scenes 1–3 and 11–13 are diagrams; the middle
 * is the portal itself.
 */
const adminDsrReceipts: Tutorial = {
  id: 'admin-dsr-receipts',
  compositionId: 'AdminDsrReceipts',
  title: 'DSR में Receipt हाथ से भरना',
  subtitle: 'MDG एडमिन टीम के लिए — रसीद सुधारना और रिपोर्ट दोबारा बनवाना',
  scenes: [
    {
      id: 'intro',
      step: 'intro',
      text: 'नमस्ते! यह वीडियो MDG की एडमिन टीम के लिए है। DSR की इस शीट में हर आँकड़ा किसी मशीन से आता है — डिप टैंक से, रीडिंग पंप से। सिर्फ़ एक खाना ऐसा है जिसे कोई मशीन नहीं नापती — RECEIPT, यानी उस दिन टैंक में कितना माल उतरा।',
      estSeconds: 15,
    },
    {
      id: 'why',
      step: 'why',
      text: 'टैंकर से माल उतरा या नहीं, यह पोर्टल को तभी पता चलता है जब पंप पर कोई इंसान उसकी एंट्री करे। एंट्री रह गई, या देर से हुई, तो रिपोर्ट में उस दिन का receipt शून्य दिखेगा — जबकि असल में तीन हज़ार नौ सौ तैंतीस लीटर उतरा था।',
      estSeconds: 15,
    },
    {
      id: 'impact',
      step: 'impact',
      text: 'एक ग़लत receipt सिर्फ़ उसी दिन को ख़राब नहीं करता। उस दिन का Total stock ग़लत होता है, और उसके बाद की हर रिपोर्ट का variation भी — क्योंकि variation पिछली जाँच से अब तक के सारे receipt जोड़कर बनता है। पर sales और cumulative पर कोई असर नहीं पड़ता — वे सिर्फ़ मीटर रीडिंग से बनते हैं।',
      estSeconds: 18,
    },
    {
      id: 'nav',
      step: 'nav',
      text: "इसे ठीक करना अब आसान है। डीलर खोलिए और ऊपर 'Data Vault' टैब पर जाइए। वहाँ की पट्टी में 'Daily Sales Report' चुनिए — इस डीलर की सारी DSR रिपोर्ट यहीं रहती हैं।",
      estSeconds: 13,
    },
    {
      id: 'open',
      step: 'open',
      text: "सबसे ऊपर तारीख़ वाली लाइन में 'Receipts' बटन है। उसे दबाइए।",
      estSeconds: 6,
    },
    {
      id: 'dialog',
      step: 'dialog',
      text: 'एक छोटी खिड़की खुलेगी। सबसे ऊपर तारीख़ चुनिए — वही दिन जिस दिन टैंकर आया था। नीचे डीलर के हर प्रोडक्ट की एक लाइन है, और हर लाइन के दाईं ओर लिखा रहता है कि IRAS उस दिन का क्या बताता है।',
      estSeconds: 14,
    },
    {
      id: 'enter',
      step: 'enter',
      text: 'MOTOR SPIRIT वाले खाने में असली संख्या भरिए — तीन हज़ार नौ सौ तैंतीस। चाहें तो इनवॉइस नंबर और कारण भी लिख दीजिए; ये सिर्फ़ रिकॉर्ड के लिए हैं, हिसाब में नहीं जाते। जो खाना ख़ाली छोड़ेंगे, उसमें IRAS का ही आँकड़ा चलता रहेगा।',
      estSeconds: 17,
    },
    {
      id: 'save',
      step: 'save',
      text: "अब 'Save receipts' दबाइए। ध्यान दीजिए — यहाँ सिर्फ़ आँकड़ा सेव होता है, रिपोर्ट अपने आप दोबारा नहीं बनती। सिस्टम बता देता है कि इस बदलाव से कितनी रिपोर्ट पुरानी पड़ गई हैं।",
      estSeconds: 14,
    },
    {
      id: 'stale',
      step: 'stale',
      text: "अब उन रिपोर्ट पर एक पीली पट्टी दिखने लगेगी — 'This report is out of date'। उसमें लिखा रहता है कि किस दिन का कौन सा receipt बदला, और उससे कितनी और रिपोर्ट पर असर पड़ा।",
      estSeconds: 13,
    },
    {
      id: 'regenerate',
      step: 'regenerate',
      text: "उसी पट्टी में 'Regenerate' दबाइए। सिस्टम सबसे पुरानी बिगड़ी तारीख़ से शुरू करके आगे की रिपोर्ट भी अपने आप ठीक कर देता है। यह काम अपने आप कभी नहीं होता — फ़ैसला हमेशा आपका, क्योंकि इसमें पोर्टल से डेटा लेना भी पड़ सकता है।",
      estSeconds: 16,
    },
    {
      id: 'after',
      step: 'after',
      text: "रिपोर्ट बनते ही उस दिन का receipt तीन हज़ार नौ सौ तैंतीस दिखने लगेगा, Total stock भी उतना ही बढ़ जाएगा, और variation ठीक हो जाएगा। संख्या के ऊपर छोटा सा 'M' दिखता है — इसका मतलब यह आँकड़ा हाथ से भरा गया है।",
      estSeconds: 15,
    },
    {
      id: 'rules',
      step: 'rules',
      text: 'तीन बातें याद रखिए। पहली — हाथ से भरा आँकड़ा IRAS वाले की जगह लेता है, उसमें जुड़ता नहीं। दूसरी — शून्य भी एक असली जवाब है; अगर पोर्टल में ग़लती से एंट्री हो गई हो तो शून्य भरिए। तीसरी — खाना ख़ाली कर देंगे तो वापस IRAS का आँकड़ा चलने लगेगा।',
      estSeconds: 18,
    },
    {
      id: 'safety',
      step: 'safety',
      text: 'एक और भरोसे की बात। पुराने बंद हो चुके दिन में सिर्फ़ receipt और total stock बदलते हैं — उस दिन की sales और cumulative जैसी थीं वैसी ही रहती हैं। और हर बदलाव Activity log में दर्ज होता है: किसने, कब, कितना बदला।',
      estSeconds: 15,
    },
    {
      id: 'recap',
      step: 'recap',
      text: "संक्षेप में — Receipts खोलिए, तारीख़ चुनिए, असली लीटर भरिए, Save receipts दबाइए, और फिर पीली पट्टी से Regenerate कीजिए। बस इतना ही। धन्यवाद!",
      estSeconds: 13,
    },
  ],
};

export const TUTORIALS: Tutorial[] = [
  login,
  addWarrior,
  givePoints,
  splitPoints,
  submitPoints,
  pointsSystem,
  creditMonitor,
  adminCreditDod,
  adminCreditDodPortal,
  adminDsrReceipts,
];

export const TUTORIAL_BY_ID: Record<string, Tutorial> = Object.fromEntries(
  TUTORIALS.map((t) => [t.id, t]),
);
