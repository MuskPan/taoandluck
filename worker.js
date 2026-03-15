export default {
  async fetch(request) {
    const url = new URL(request.url);

    // 处理 CORS 预检
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    const type = url.searchParams.get('type') || 'star'; // 'star' 星座 / 'zodiac' 生肖
    const sign = url.searchParams.get('sign') || '';
    const period = url.searchParams.get('period') || 'daily';

    const corsHeaders = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    };

    try {
      if (type === 'zodiac') {
        // ── 生肖运势：findyourfate.com ──
        const apiUrl = `https://www.findyourfate.com/ai/chinese-horoscope-translate.php?sign=${sign}&period=${period}&lang=zh`;
        const res = await fetch(apiUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const data = await res.json();

        return new Response(JSON.stringify({
          type: 'zodiac',
          sign: sign,
          data: {
            overview:     data.overview     || '',
            love:         data.love         || '',
            career:       data.career       || '',
            wealth:       data.wealth       || '',
            tips:         data.tips         || '',
            lucky_numbers: data.lucky_numbers || data.numbers || '',
            lucky_colors:  data.lucky_colors  || data.colors  || '',
          }
        }), { headers: corsHeaders });

      } else {
        // ── 星座运势：freehoroscopeapi.com + MyMemory翻译 ──
        const apiUrl = `https://freehoroscopeapi.com/api/v1/get-horoscope/${period}?sign=${sign}`;
        const res = await fetch(apiUrl);
        const data = await res.json();
        let enText = data && data.data && data.data.horoscope ? data.data.horoscope.trim() : '';

        // 去掉开头的星座名称（如 "Cancer, today..."）
        const SIGN_NAMES = [
          'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
          'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'
        ];
        for (const s of SIGN_NAMES) {
          enText = enText.replace(new RegExp('^' + s + '[,:\\-\\s]+', 'i'), '');
        }

        // MyMemory 翻译
        let zhText = enText;
        if (enText) {
          try {
            const transRes = await fetch(
              'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(enText) + '&langpair=en|zh'
            );
            const transData = await transRes.json();
            if (transData?.responseData?.translatedText) {
              zhText = transData.responseData.translatedText;
            }
          } catch (e) { /* 翻译失败保留英文 */ }
        }

        return new Response(JSON.stringify({
          type: 'star',
          sign: sign,
          data: { date: data?.data?.date, period, horoscope: zhText }
        }), { headers: corsHeaders });
      }

    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
  },
};
