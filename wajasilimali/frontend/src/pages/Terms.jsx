import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between">
        <Link to="/" className="font-bold text-primary-700">
          WAJASILIAMALI
        </Link>
        <Link to="/register" className="text-sm text-primary-600 hover:underline">
          Rudi kusajili
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          Masharti ya Huduma
        </h1>
        <p className="text-sm text-slate-500 mb-8">
          Toleo la mwisho: Agosti 2026 · WAJASILIAMALI
        </p>

        <div className="prose prose-slate max-w-none space-y-6 text-sm sm:text-base text-slate-700 leading-relaxed bg-white rounded-xl border border-slate-100 p-6 sm:p-8 shadow-sm">
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">1. Utangulizi</h2>
            <p>
              Karibu kwenye <strong>WAJASILIAMALI</strong> — mfumo wa kidijitali wa kusimamia mauzo,
              stoki, madeni na risiti kwa wafanyabiashara wadogo na wa kati (SMEs).
              Kwa kusajili akaunti au kutumia huduma hii, unakubali Masharti haya.
              Usipokubali, usitumie mfumo.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">2. Ufafanuzi</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Huduma</strong> — tovuti na mfumo wa WAJASILIAMALI.
              </li>
              <li>
                <strong>Mtumiaji</strong> — mtu au biashara iliyosajili akaunti.
              </li>
              <li>
                <strong>Data ya biashara</strong> — taarifa za bidhaa, mauzo, wateja, madeni n.k.
                unazoweka kwenye mfumo.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">3. Akaunti na usalama</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Unawajibika kutoa taarifa sahihi unaposajili.</li>
              <li>Unawajibika kulinda nenosiri lako na kutotowa ufikiaji kwa watu wasioidhinishwa.</li>
              <li>
                Kila biashara ina data yake; huwezi kufikia data ya biashara nyingine isipokuwa
                kwa idhini ya mmiliki au msimamizi wa jukwaa (super admin).
              </li>
              <li>
                Tutahifadhi haki ya kusitisha akaunti inayotumiwa vibaya, kwa udanganyifu, au
                inayokiuka masharti.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">4. Matumizi yanayoruhusiwa</h2>
            <p>Unaweza kutumia mfumo kwa:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Kusimamia stoki na bei za bidhaa</li>
              <li>Kurekodi mauzo na kutoa risiti</li>
              <li>Kufuatilia madeni ya wateja</li>
              <li>Kuona muhtasari na ripoti za biashara yako</li>
            </ul>
            <p className="mt-2">Hairuhusiwi:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Kujaribu kuvunja, kuhack, au kuharibu mfumo</li>
              <li>Kutuma virus, spam, au maudhui haramu</li>
              <li>Kutumia data ya watu wengine bila idhini</li>
              <li>Kukiuka sheria za Tanzania au kimataifa</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">5. Data na faragha</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Data ya biashara yako inahifadhiwa ili kukupa huduma (stoki, mauzo, madeni, n.k.).
              </li>
              <li>
                Hatutauza data yako kwa wahusika wengine kwa madhumuni ya kibiashara yasiyohusiana
                na huduma.
              </li>
              <li>
                Unaweza kuomba kufuta akaunti; baadhi ya kumbukumbu zinaweza kubaki kwa muda kwa
                sababu za kisheria au usalama.
              </li>
              <li>
                Tunashauri ufanye nakala (backup) ya taarifa muhimu — mfumo hautoi dhamana kamili
                dhidi ya upotevu wa data kutokana na matukio nje ya udhibiti wetu.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">6. Malipo na bei (ikiwa itatumika)</h2>
            <p>
              Toleo la sasa linaweza kuwa bure au lenye mipango ya baadaye. Mabadiliko ya bei
              yatatangazwa kwenye tovuti. Kama kuna malipo, unakubali kulipa kulingana na mpango
              uliochagua.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">7. Risiti na SMS / WhatsApp</h2>
            <p>
              Uwezo wa kutuma risiti kwa SMS au WhatsApp unategemea kifaa chako na mtandao.
              WAJASILIAMALI haidhamini uwasilishaji wa kila ujumbe, wala haichukui gharama za SMS
              za mtandao wako ikiwa unatumia njia za nje.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">8. Dhima (Limitation of liability)</h2>
            <p>
              Huduma inatolewa &quot;kama ilivyo&quot; (as is). Hatuhakikishii kuwa itakuwa bila
              hitilafu au usumbufu kila wakati. Hatuwajibiki kwa hasara isiyo ya moja kwa moja,
              upotevu wa faida, au uharibifu unaotokana na matumizi au kushindwa kutumia mfumo,
              isipokuwa pale sheria inavyolazimisha.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">9. Mabadiliko ya masharti</h2>
            <p>
              Tunaweza kubadilisha Masharti haya. Toleo jipya litachapishwa kwenye ukurasa huu na
              tarehe itasasishwa. Kuendelea kutumia huduma baada ya mabadiliko kunamaanisha
              unakubali toleo jipya.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">10. Sheria inayotawala</h2>
            <p>
              Masharti haya yanatawaliwa na sheria za <strong>Jamhuri ya Muungano wa Tanzania</strong>.
              Migogoro itashughulikiwa kwanza kwa mazungumzo; vinginevyo mahakama zenye mamlaka
              Tanzania.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">11. Mawasiliano</h2>
            <p>
              Maswali, malalamiko au msaada kuhusu tovuti / mfumo wa WAJASILIAMALI wasiliana
              moja kwa moja na <strong>Super Administrator</strong>:
            </p>
            <ul className="list-none pl-0 mt-3 space-y-2">
              <li>
                <strong>Jina:</strong> Adroph Audiphance Andrea
              </li>
              <li>
                <strong>Barua pepe:</strong>{' '}
                <a href="mailto:adroph2605@gmail.com" className="text-primary-600 hover:underline">
                  adroph2605@gmail.com
                </a>
              </li>
            </ul>
          </section>

          <p className="text-slate-500 text-sm pt-4 border-t">
            Kwa kubofya &quot;Nakubali&quot; unaposajili, unathibitisha umesoma na kukubali
            Masharti haya ya Huduma.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/register"
            className="px-6 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700"
          >
            Rudi kusajili
          </Link>
          <Link
            to="/"
            className="px-6 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-white"
          >
            Nyumbani
          </Link>
        </div>
      </main>
    </div>
  );
}
