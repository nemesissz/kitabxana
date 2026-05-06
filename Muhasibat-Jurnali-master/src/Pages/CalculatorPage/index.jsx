import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import CalculateIcon from "@mui/icons-material/Calculate";

import styles from "./index.module.scss";
import bg from "./../../Assets/heroImage.jpg";
import Footer from "../../Layouts/Footer";
import dataContext from "../../Contexts/GlobalState";
import Base_Url_Server from "../../Constants/baseUrl";

const formatCurrency = (value) =>
  new Intl.NumberFormat("az-AZ", {
    style: "currency",
    currency: "AZN",
    minimumFractionDigits: 2,
  }).format(value);

const DEFAULT_BASE_PENSION = 320;
const DEFAULT_EXPECTED_MONTHS = 144;

function CalculatorPage() {
  const store = useContext(dataContext);

  const [form, setForm] = useState({
    pensionCapital: "",
    voluntaryCapital: "",
    basePension: DEFAULT_BASE_PENSION,
    payoutMonths: DEFAULT_EXPECTED_MONTHS,
    pre2006Years: "",
    pre2006Bonus: "",
  });

  const [estimateForm, setEstimateForm] = useState({
    averageSalary: "",
    contributionRate: 25,
    contributionYears: "",
  });

  const [result, setResult] = useState(null);
  const [estimatedCapital, setEstimatedCapital] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userID = localStorage.getItem("user");
    if (!token || !userID) {
      store.user.setData(null);
    } else {
      axios
        .get(Base_Url_Server + "users/" + userID, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          store.user.setData(response.data.data.user);
        })
        .catch(() => {
          store.user.setData(null);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        });
    }
  }, []);

  const minimumCapitalRequirement = useMemo(
    () => form.basePension * form.payoutMonths,
    [form.basePension, form.payoutMonths]
  );

  const handleInputChange = (key) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleEstimateInputChange = (key) => (event) => {
    const value = event.target.value;
    setEstimateForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCalculate = () => {
    const pensionCapital = parseFloat(form.pensionCapital) || 0;
    const voluntaryCapital = parseFloat(form.voluntaryCapital) || 0;
    const basePension = parseFloat(form.basePension) || 0;
    const payoutMonths = parseFloat(form.payoutMonths) || DEFAULT_EXPECTED_MONTHS;
    const pre2006Years = parseFloat(form.pre2006Years) || 0;
    const pre2006Bonus = parseFloat(form.pre2006Bonus) || 0;

    if (payoutMonths <= 0) {
      setResult({
        error: "Gözlənilən ömür (ay) sıfırdan böyük olmalıdır.",
      });
      return;
    }

    if (pensionCapital <= 0 && voluntaryCapital <= 0) {
      setResult({
        error:
          "Ən azı fərdi pensiya kapitalı və ya könüllü kapital məbləği daxil edilməlidir.",
      });
      return;
    }

    const insuredPart = pensionCapital / payoutMonths;
    const voluntaryPart = voluntaryCapital / payoutMonths;
    const stajBonus = pre2006Years * pre2006Bonus;

    const total = basePension + insuredPart + voluntaryPart + stajBonus;

    setResult({
      total,
      basePension,
      insuredPart,
      voluntaryPart,
      stajBonus,
      payoutMonths,
      pensionCapital,
      voluntaryCapital,
      minimumCapital: basePension * payoutMonths,
      capitalGap: Math.max(basePension * payoutMonths - pensionCapital, 0),
    });
  };

  const handleReset = () => {
    setForm({
      pensionCapital: "",
      voluntaryCapital: "",
      basePension: DEFAULT_BASE_PENSION,
      payoutMonths: DEFAULT_EXPECTED_MONTHS,
      pre2006Years: "",
      pre2006Bonus: "",
    });
    setResult(null);
  };

  const handleEstimate = () => {
    const averageSalary = parseFloat(estimateForm.averageSalary) || 0;
    const contributionRate = parseFloat(estimateForm.contributionRate) || 0;
    const contributionYears = parseFloat(estimateForm.contributionYears) || 0;

    if (averageSalary <= 0 || contributionRate <= 0 || contributionYears <= 0) {
      setEstimatedCapital({
        error: "Bütün sahələr üçün müsbət dəyərlər daxil edin.",
      });
      return;
    }

    const yearlyContribution = averageSalary * 12 * (contributionRate / 100);
    const capital = yearlyContribution * contributionYears;

    setEstimatedCapital({
      capital,
      yearlyContribution,
      contributionYears,
      contributionRate,
    });
  };

  const handleEstimateReset = () => {
    setEstimateForm({
      averageSalary: "",
      contributionRate: 25,
      contributionYears: "",
    });
    setEstimatedCapital(null);
  };

  return (
    <>
      <section className={styles.calculator}>
        <div className={styles.hero}>
          <div className={styles.bgImage}>
            <img src={bg} alt="accountant" />
            <h1>Pensiyanızı dəqiq öyrənin, sabahınıza arxayın olun!</h1>
          </div>
        </div>

        <div className={styles.calc}>
          <div className={styles.header}>
            <div></div>
            <CalculateIcon className={styles.icon} />
            <div></div>
          </div>

          <div className={styles.container}>
            <div className={styles.grid}>
              <div className={styles.card}>
                <h3>Əsas pensiya kalkulyatoru</h3>
                <p className={styles.helperText}>
                  Azərbaycan qanunvericiliyinə görə fərdi pensiya kapitalı
                  gözlənilən ömür müddətinə bölünür və nəticəyə dövlətin
                  təyin etdiyi baza pensiyası əlavə olunur.{" "}
                  <a
                    href="https://socialprotection-humanrights.org/wp-content/uploads/2018/07/Universal-Social-Protection-Country-Cases.pdf?utm_source=openai"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Mənbə
                  </a>
                  .
                </p>

                <div className={styles.fieldGroup}>
                  <label htmlFor="pensionCapital">Fərdi pensiya kapitalı (AZN)</label>
                  <input
                    id="pensionCapital"
                    type="number"
                    min="0"
                    value={form.pensionCapital}
                    onChange={handleInputChange("pensionCapital")}
                    placeholder="məs: 48000"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="voluntaryCapital">Könüllü pensiya kapitalı (AZN)</label>
                  <input
                    id="voluntaryCapital"
                    type="number"
                    min="0"
                    value={form.voluntaryCapital}
                    onChange={handleInputChange("voluntaryCapital")}
                    placeholder="istəyə görə"
                  />
                </div>

                <div className={styles.inlineFields}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="basePension">Baza pensiyası (AZN)</label>
                    <input
                      id="basePension"
                      type="number"
                      min="0"
                      value={form.basePension}
                      onChange={handleInputChange("basePension")}
                      placeholder={`${DEFAULT_BASE_PENSION}`}
                    />
                    <span className={styles.caption}>
                      Minimum əmək pensiyası 320 AZN-dir.{" "}
                      <a
                        href="https://en.apa.az/social/azerbaijan-increases-minimum-amount-of-labor-pension-to-azn-320-459952?utm_source=openai"
                        target="_blank"
                        rel="noreferrer"
                      >
                        (APA)
                      </a>
                    </span>
                  </div>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="payoutMonths">Gözlənilən ömür (ay)</label>
                    <input
                      id="payoutMonths"
                      type="number"
                      min="1"
                      value={form.payoutMonths}
                      onChange={handleInputChange("payoutMonths")}
                      placeholder={`${DEFAULT_EXPECTED_MONTHS}`}
                    />
                    <span className={styles.caption}>
                      Qanuna əsasən standart müddət 144 aydır.{" "}
                      <a
                        href="https://medianews.az/en/azerbaycanda-mumkun-pensiya-artimi?utm_source=openai"
                        target="_blank"
                        rel="noreferrer"
                      >
                        (Medianews)
                      </a>
                    </span>
                  </div>
                </div>

                <div className={styles.inlineFields}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="pre2006Years">
                      2006-cı ilədək sığorta stajı (il)
                    </label>
                    <input
                      id="pre2006Years"
                      type="number"
                      min="0"
                      value={form.pre2006Years}
                      onChange={handleInputChange("pre2006Years")}
                      placeholder="məs: 10"
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="pre2006Bonus">
                      Hər staj ili üçün əlavəni daxil edin (AZN)
                    </label>
                    <input
                      id="pre2006Bonus"
                      type="number"
                      min="0"
                      value={form.pre2006Bonus}
                      onChange={handleInputChange("pre2006Bonus")}
                      placeholder="istəyə görə"
                    />
                    <span className={styles.caption}>
                      2006-cı ilədək staj üçün əlavə məbləğ qanunvericiliyə əsasən
                      fərqli ola bilər.
                    </span>
                  </div>
                </div>

                <div className={styles.buttonRow}>
                  <button onClick={handleCalculate}>Hesabla</button>
                  <button className={styles.secondary} onClick={handleReset}>
                    Təmizlə
                  </button>
                </div>
              </div>

              <div className={styles.card}>
                <h3>Nəticə</h3>
                {!result ? (
                  <p className={styles.helperText}>
                    Nəticəni görmək üçün məlumatları daxil edib “Hesabla” düyməsini
                    sıxın.
                  </p>
                ) : result.error ? (
                  <p className={styles.error}>{result.error}</p>
                ) : (
                  <div className={styles.results}>
                    <div className={styles.resultRow}>
                      <span>Ümumi aylıq pensiya</span>
                      <strong>{formatCurrency(result.total)}</strong>
                    </div>
                    <div className={styles.separator}></div>
                    <div className={styles.resultRow}>
                      <span>Baza pensiyası</span>
                      <span>{formatCurrency(result.basePension)}</span>
                    </div>
                    <div className={styles.resultRow}>
                      <span>Sığorta hissəsi</span>
                      <span>{formatCurrency(result.insuredPart)}</span>
                    </div>
                    {result.voluntaryCapital > 0 && (
                      <div className={styles.resultRow}>
                        <span>Könüllü hissə</span>
                        <span>{formatCurrency(result.voluntaryPart)}</span>
                      </div>
                    )}
                    {result.stajBonus > 0 && (
                      <div className={styles.resultRow}>
                        <span>Staj bonusu</span>
                        <span>{formatCurrency(result.stajBonus)}</span>
                      </div>
                    )}
                    <div className={styles.notice}>
                      <p>
                        Minimum tələb olunan kapital:{" "}
                        <strong>{formatCurrency(result.minimumCapital)}</strong>
                      </p>
                      {result.capitalGap > 0 ? (
                        <p>
                          Mövcud kapitalınız bu həddi {formatCurrency(result.capitalGap)}{" "}
                          az tamamlayır.
                        </p>
                      ) : (
                        <p>Kapitalınız minimum tələbi qarşılayır.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.grid}>
              <div className={styles.card}>
                <h3>Pensiya kapitalını təxmini hesabla</h3>
                <p className={styles.helperText}>
                  Bu bölmə sadə yanaşma ilə illik sosial sığorta ayırmalarına əsaslanan
                  pensiya kapitalını təxmini hesablayır.
                </p>

                <div className={styles.fieldGroup}>
                  <label htmlFor="averageSalary">
                    Orta aylıq əmək haqqı (AZN)
                  </label>
                  <input
                    id="averageSalary"
                    type="number"
                    min="0"
                    value={estimateForm.averageSalary}
                    onChange={handleEstimateInputChange("averageSalary")}
                    placeholder="məs: 1200"
                  />
                </div>

                <div className={styles.inlineFields}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="contributionRate">
                      Sosial sığorta ayırması (%)
                    </label>
                    <input
                      id="contributionRate"
                      type="number"
                      min="0"
                      value={estimateForm.contributionRate}
                      onChange={handleEstimateInputChange("contributionRate")}
                      placeholder="məs: 25"
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="contributionYears">Sığorta illəri</label>
                    <input
                      id="contributionYears"
                      type="number"
                      min="0"
                      value={estimateForm.contributionYears}
                      onChange={handleEstimateInputChange("contributionYears")}
                      placeholder="məs: 20"
                    />
                  </div>
                </div>

                <div className={styles.buttonRow}>
                  <button onClick={handleEstimate}>Kapitali hesabla</button>
                  <button
                    className={styles.secondary}
                    onClick={handleEstimateReset}
                  >
                    Təmizlə
                  </button>
                </div>

                {estimatedCapital && (
                  <div className={styles.estimateResult}>
                    {estimatedCapital.error ? (
                      <p className={styles.error}>{estimatedCapital.error}</p>
                    ) : (
                      <>
                        <p>
                          Təxmini illik ayırma:{" "}
                          <strong>
                            {formatCurrency(estimatedCapital.yearlyContribution)}
                          </strong>
                        </p>
                        <p>
                          Ümumi pensiya kapitalı:{" "}
                          <strong>{formatCurrency(estimatedCapital.capital)}</strong>
                        </p>
                        <p className={styles.caption}>
                          Bu hesablamada maaş artımı və indeksasiya nəzərə alınmır.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className={styles.card}>
                <h3>Əsas hüquqi məlumat</h3>
                <ul className={styles.infoList}>
                  <li>
                    Sığorta hissəsi fərdi pensiya kapitalının{" "}
                    <strong>144 aya</strong> bölünməsi ilə müəyyən edilir.{" "}
                    <a
                      href="https://socialprotection-humanrights.org/wp-content/uploads/2018/07/Universal-Social-Protection-Country-Cases.pdf?utm_source=openai"
                      target="_blank"
                      rel="noreferrer"
                    >
                      (Universal Social Protection Country Cases)
                    </a>
                  </li>
                  <li>
                    Minimum əmək pensiyası 2025-ci il üzrə{" "}
                    <strong>320 AZN</strong> olaraq təsdiqlənib.{" "}
                    <a
                      href="https://en.apa.az/social/azerbaijan-increases-minimum-amount-of-labor-pension-to-azn-320-459952?utm_source=openai"
                      target="_blank"
                      rel="noreferrer"
                    >
                      (APA)
                    </a>
                  </li>
                  <li>
                    Pensiya hüququ üçün tələb olunan minimum kapital{" "}
                    <strong>320 × 144 = 46&nbsp;080 AZN</strong> təşkil edir.{" "}
                    <a
                      href="https://medianews.az/en/azerbaycanda-mumkun-pensiya-artimi?utm_source=openai"
                      target="_blank"
                      rel="noreferrer"
                    >
                      (Medianews)
                    </a>
                  </li>
                  <li>
                    Qanunvericilikdəki dəyişiklikləri nəzərdə saxlamaq üçün
                    rəsmi{" "}
                    <a
                      href="https://e-social.gov.az/en/calculate?utm_source=openai"
                      target="_blank"
                      rel="noreferrer"
                    >
                      e-Social pensiya kalkulyatoru
                    </a>
                    ndan da istifadə edə bilərsiniz.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

export default CalculatorPage;
