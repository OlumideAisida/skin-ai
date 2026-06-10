"""
populate_kb.py
Run this once to populate the dermatology_kb table with condition entries.
Usage: python populate_kb.py
"""

import os
import httpx
import json
import time

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# ── Dermatology Knowledge Base ────────────────────────────────
CONDITIONS = [
    {
        "condition_name": "Acne Vulgaris",
        "category": "Inflammatory",
        "fitzpatrick_relevance": "Types IV-VI are at higher risk of post-inflammatory hyperpigmentation (PIH) after acne lesions resolve. Avoid aggressive treatments that worsen PIH.",
        "content": """Acne vulgaris is a chronic inflammatory disorder of the pilosebaceous unit. 
Primary lesions include comedones (open/closed), papules, pustules, nodules, and cysts. 
Common locations: face, chest, back, shoulders.
Key causes: excess sebum, Cutibacterium acnes colonization, follicular hyperkeratinization, inflammation.
Severity grading: Mild (comedones + few papules), Moderate (papules/pustules), Severe (nodules/cysts).
Treatment: Mild — topical retinoids (tretinoin, adapalene), benzoyl peroxide, salicylic acid.
Moderate — topical antibiotics (clindamycin), combination therapy.
Severe — oral antibiotics (doxycycline), isotretinoin for nodular/cystic acne.
Skin tone considerations: Darker skin tones (Fitzpatrick IV-VI) are prone to PIH. 
Recommend niacinamide, azelaic acid, and vitamin C alongside acne treatment to manage pigmentation.
Avoid: harsh physical scrubs, high-concentration glycolic acid initially, picking or popping lesions.
Diet: High glycemic index foods and dairy may exacerbate acne in some individuals."""
    },
    {
        "condition_name": "Post-Inflammatory Hyperpigmentation (PIH)",
        "category": "Pigmentation",
        "fitzpatrick_relevance": "Significantly more common and more severe in Fitzpatrick Types III-VI. Melanocytes in darker skin are more reactive and produce more melanin in response to inflammation.",
        "content": """Post-inflammatory hyperpigmentation (PIH) is darkening of the skin following inflammation or injury.
Mechanism: inflammation triggers melanocyte stimulation → excess melanin deposition in epidermis or dermis.
Common triggers: acne, eczema, psoriasis, insect bites, burns, cuts, aggressive skincare treatments.
Appearance: flat, darkened macules or patches at site of previous inflammation. 
Color ranges from tan/brown (epidermal) to grey/blue-black (dermal).
Treatment timeline: epidermal PIH can resolve in 3-24 months with treatment; dermal PIH takes longer.
Effective ingredients: Niacinamide (4-10%) — reduces melanin transfer, well-tolerated on all skin tones.
Azelaic acid (10-20%) — inhibits tyrosinase, anti-inflammatory, safe during pregnancy.
Vitamin C (L-ascorbic acid 10-20%) — antioxidant, brightening, boosts collagen.
Alpha arbutin (1-2%) — tyrosinase inhibitor, gentler than hydroquinone.
Kojic acid (1-4%) — derived from fungi, effective brightener.
Hydroquinone (2-4%) — gold standard but use in short courses (3-6 months) due to risk of ochronosis.
Retinoids — increase cell turnover, fade pigmentation over time.
SPF: Daily broad-spectrum SPF 30+ is essential — UV exposure darkens PIH significantly.
Avoid: aggressive exfoliation, picking, and treatments that cause further inflammation."""
    },
    {
        "condition_name": "Melasma",
        "category": "Pigmentation",
        "fitzpatrick_relevance": "Most common in Fitzpatrick Types III-V. Hormonal triggers combined with UV exposure are the primary drivers. More common in women of Latin American, Middle Eastern, South Asian, and African descent.",
        "content": """Melasma is a chronic acquired hyperpigmentation disorder characterized by symmetrical brown-grey patches.
Common locations: cheeks, forehead, upper lip, nose, chin (centrofacial pattern most common).
Triggers: UV radiation, hormonal changes (pregnancy, oral contraceptives), heat, thyroid dysfunction.
Types: Epidermal (well-defined, responds well to treatment), Dermal (less defined, harder to treat), Mixed.
Wood's lamp exam: epidermal melasma accentuated under UV light; dermal type not enhanced.
Treatment: Triple combination cream (hydroquinone 4% + tretinoin 0.05% + fluocinolone acetonide 0.01%) is gold standard.
Monotherapy: hydroquinone 4%, tretinoin, azelaic acid 20%, kojic acid, tranexamic acid (oral or topical).
Chemical peels: glycolic acid, salicylic acid peels for stubborn cases — use with caution on darker skin.
Laser/IPL: risk of worsening PIH in darker skin tones; proceed with extreme caution.
Sunscreen: daily SPF 50+ with UVA/UVB protection is mandatory — melasma is notoriously difficult to treat without strict sun protection.
Maintenance: melasma is chronic and tends to recur; long-term sun protection and maintenance therapy required.
Pregnancy melasma (chloasma) often resolves postpartum but may persist."""
    },
    {
        "condition_name": "Atopic Dermatitis (Eczema)",
        "category": "Inflammatory",
        "fitzpatrick_relevance": "In darker skin tones, eczema may appear purple, grey, or brown rather than red, making it harder to diagnose. Follicular eczema (prominent hair follicle involvement) is more common in Types IV-VI.",
        "content": """Atopic dermatitis (AD) is a chronic, relapsing inflammatory skin condition associated with skin barrier dysfunction.
Hallmark features: intense pruritus (itching), xerosis (dry skin), eczematous lesions.
Pathophysiology: filaggrin gene mutations → impaired skin barrier → increased transepidermal water loss → allergen/irritant penetration → Th2-mediated immune response.
Clinical features: acute (erythema, vesicles, weeping), subacute (scaling, crusting), chronic (lichenification, fissuring).
Common locations: flexural areas (antecubital/popliteal fossae), neck, wrists, ankles, face in infants.
Darker skin presentation: may show follicular accentuation, lichenification, and post-inflammatory dyspigmentation more prominently.
Triggers: irritants (soaps, detergents), allergens (dust mites, pet dander), stress, temperature changes, sweating.
Treatment: Emollients — first-line, apply immediately after bathing. Use thick creams or ointments (ceramide-containing preferred).
Topical corticosteroids — mainstay for flares; use appropriate potency for body location.
Topical calcineurin inhibitors (tacrolimus, pimecrolimus) — steroid-sparing, good for face/sensitive areas.
Dupilumab (biologic) — for moderate-severe AD unresponsive to topicals.
Antihistamines for pruritus relief.
Bleach baths (dilute sodium hypochlorite) can reduce bacterial colonization.
Avoid: fragranced products, wool clothing, long hot showers."""
    },
    {
        "condition_name": "Seborrheic Dermatitis",
        "category": "Inflammatory",
        "fitzpatrick_relevance": "In darker skin tones, seborrheic dermatitis may present with hypopigmented (lighter) patches rather than red/pink scaling, which can be mistaken for tinea versicolor or vitiligo.",
        "content": """Seborrheic dermatitis is a common chronic inflammatory condition affecting sebaceous gland-rich areas.
Pathophysiology: Malassezia yeast overgrowth on sebum-rich skin triggers inflammatory response.
Common locations: scalp (dandruff), nasolabial folds, eyebrows, eyelids, ears, chest, groin.
Appearance: greasy yellowish scales, underlying erythema (or hypopigmentation in darker skin), mild pruritus.
Triggers: stress, cold weather, fatigue, immunosuppression (more severe in HIV patients), neurological conditions (Parkinson's disease).
Scalp treatment: antifungal shampoos (ketoconazole 2%, selenium sulfide 2.5%, zinc pyrithione).
Use 2-3x/week during flares, 1x/week for maintenance. Leave on 5 minutes before rinsing.
Facial treatment: ketoconazole cream 2%, ciclopirox cream, low-potency topical corticosteroids for acute flares.
Calcineurin inhibitors (tacrolimus, pimecrolimus) for maintenance — avoid long-term steroids on face.
Lifestyle: regular gentle cleansing, stress management, avoid harsh scrubbing.
Prognosis: chronic relapsing condition requiring ongoing maintenance therapy."""
    },
    {
        "condition_name": "Psoriasis",
        "category": "Inflammatory",
        "fitzpatrick_relevance": "In Fitzpatrick Types IV-VI, psoriasis plaques appear more violaceous (purple) than red and leave significant post-inflammatory hyperpigmentation or hypopigmentation after treatment. PASI scoring may underestimate severity in darker skin.",
        "content": """Psoriasis is a chronic immune-mediated inflammatory skin disease with hyperproliferation of keratinocytes.
Pathophysiology: T-cell activation → TNF-α, IL-17, IL-23 → rapid keratinocyte turnover (3-5 days vs normal 28-30 days).
Types: Plaque (most common, 80-90%), Guttate, Inverse, Pustular, Erythrodermic.
Plaque psoriasis: well-demarcated, silvery-white scaly plaques on erythematous base.
Common locations: elbows, knees, scalp, lower back, nails, perianal area.
Associated conditions: psoriatic arthritis (30%), cardiovascular disease, metabolic syndrome, depression.
Nail involvement: pitting, onycholysis, oil spots, subungual hyperkeratosis.
Severity: mild (<3% BSA), moderate (3-10%), severe (>10% or significant functional impairment).
Treatment: Mild — topical corticosteroids, vitamin D analogues (calcipotriol), tazarotene.
Moderate — phototherapy (NB-UVB), methotrexate, cyclosporine, acitretin.
Severe — biologics (TNF-α inhibitors: adalimumab, etanercept; IL-17 inhibitors: secukinumab; IL-23 inhibitors: guselkumab).
Scalp: medicated shampoos, topical steroids, calcipotriol/betamethasone combination.
Moisturizers: essential for all patients to reduce scale and pruritus.
Triggers: stress, infections (streptococcal), certain medications (beta-blockers, lithium, NSAIDs), alcohol."""
    },
    {
        "condition_name": "Rosacea",
        "category": "Inflammatory",
        "fitzpatrick_relevance": "Rosacea is significantly underdiagnosed in darker skin tones because erythema (redness) is less visible. Patients of color may present primarily with papules/pustules, burning, or stinging without obvious redness.",
        "content": """Rosacea is a chronic inflammatory vascular condition primarily affecting the central face.
Subtypes: Erythematotelangiectatic (flushing, redness, telangiectasia), Papulopustular (acne-like breakouts), 
Phymatous (skin thickening, rhinophyma), Ocular (eye irritation, redness).
Triggers: sun exposure, hot beverages, spicy food, alcohol, exercise, temperature extremes, stress, certain skincare products.
Pathophysiology: neurovascular dysregulation, Demodex mite overgrowth, dysbiosis, impaired skin barrier.
Treatment: Topical — metronidazole 0.75-1%, azelaic acid 15-20% gel, ivermectin 1% cream, brimonidine (for erythema).
Oral — doxycycline 40mg modified-release (subantimicrobial dose), isotretinoin for severe cases.
Laser/IPL — for telangiectasia and persistent erythema (caution in darker skin tones).
Skincare: gentle, fragrance-free cleansers and moisturizers. Daily SPF 30+ is essential.
Niacinamide helps reduce skin sensitivity and supports barrier function.
Avoid: harsh exfoliants, alcohol-based products, menthol, witch hazel.
Ocular rosacea: warm compresses, eyelid hygiene, artificial tears, oral doxycycline."""
    },
    {
        "condition_name": "Tinea Versicolor",
        "category": "Fungal",
        "fitzpatrick_relevance": "In darker skin tones, tinea versicolor typically presents as hypopigmented (lighter) patches, making it more noticeable. In lighter skin, it can appear tan or pink. The hypopigmentation may persist for months after successful treatment.",
        "content": """Tinea versicolor (pityriasis versicolor) is a superficial fungal infection caused by Malassezia furfur/globosa.
Appearance: multiple small, scaly macules that may be hypopigmented, hyperpigmented, or pink depending on skin tone.
Common locations: trunk, upper arms, neck, occasionally face.
Pathophysiology: Malassezia produces azelaic acid which inhibits melanin synthesis → hypopigmentation.
Diagnosis: KOH preparation shows "spaghetti and meatballs" pattern (hyphae and spores). Wood's lamp shows yellow-green fluorescence.
Treatment: Topical — selenium sulfide 2.5% lotion/shampoo (apply, leave 10 minutes, rinse), ketoconazole 2% shampoo, 
clotrimazole, miconazole creams. Apply for 2-4 weeks.
Oral — fluconazole 300mg single dose or itraconazole 200mg daily x 7 days (for extensive/recurrent cases).
Important: pigmentation may take months to normalize even after successful treatment.
Recurrence: high (up to 80% within 2 years). Prophylactic monthly antifungal shampoo helps.
Differentiate from: vitiligo (no scaling, complete depigmentation), seborrheic dermatitis (greasy scale, different distribution)."""
    },
    {
        "condition_name": "Contact Dermatitis",
        "category": "Inflammatory",
        "fitzpatrick_relevance": "All Fitzpatrick types are affected. In darker skin, the inflammatory response may appear brown or purple rather than red, and PIH is a common sequela requiring separate treatment.",
        "content": """Contact dermatitis is skin inflammation caused by direct contact with irritants or allergens.
Two types: Irritant Contact Dermatitis (ICD) — direct toxic effect, no sensitization required.
Allergic Contact Dermatitis (ACD) — Type IV hypersensitivity, requires prior sensitization.
ICD triggers: soaps, detergents, solvents, acids, alkalis, prolonged water exposure, friction.
ACD triggers: nickel (jewelry), fragrances, preservatives (parabens, methylisothiazolinone), latex, 
hair dye (PPD), topical antibiotics (neomycin), poison ivy/oak.
Acute presentation: erythema, vesicles, weeping, pruritus at contact site.
Chronic presentation: lichenification, scaling, fissuring.
Diagnosis: patch testing for ACD to identify specific allergen.
Treatment: Remove/avoid the offending agent (most important step).
Mild-moderate: topical corticosteroids (hydrocortisone 1% for mild, betamethasone for moderate).
Severe: oral corticosteroids (prednisone taper), antihistamines for itch.
Barrier repair: emollients with ceramides to restore skin barrier.
Protective measures: gloves, barrier creams for occupational exposure.
ACD: strict allergen avoidance is key — cross-reactivity between allergens is common."""
    },
    {
        "condition_name": "Hyperpigmentation (General)",
        "category": "Pigmentation",
        "fitzpatrick_relevance": "Hyperpigmentation of all types is more prevalent and more pronounced in Fitzpatrick Types III-VI due to greater baseline melanocyte activity and reactivity.",
        "content": """Hyperpigmentation refers to darkening of skin patches due to excess melanin production.
Types: Post-inflammatory (PIH), Melasma, Solar lentigines (sun spots), Drug-induced, Friction melanosis.
Mechanism: various triggers stimulate melanocytes → increased melanin synthesis → deposition in epidermis/dermis.
Key ingredients for treatment:
Hydroquinone (2-4%): most studied skin-lightening agent. Inhibits tyrosinase. Use cycles of 3-6 months.
Kojic acid (1-4%): derived from fungi. Tyrosinase inhibitor. Can cause contact dermatitis in some.
Azelaic acid (10-20%): anti-inflammatory, anti-tyrosinase. Safe for pregnancy.
Niacinamide (4-10%): inhibits melanosome transfer. Anti-inflammatory. Well-tolerated.
Vitamin C (10-20%): antioxidant. Inhibits melanin synthesis. Brightening.
Alpha arbutin (1-2%): hydroquinone precursor. Gentler alternative.
Tranexamic acid: oral or topical. Effective for melasma and PIH.
Retinoids: increase cell turnover. Fade pigmentation. Use at night.
Combination approaches generally more effective than monotherapy.
Physical protection: SPF 50+ daily is non-negotiable — UV exposure stimulates melanogenesis.
Tinted sunscreens with iron oxides provide additional protection against visible light (relevant for melasma).
Timeline: expect 3-6 months minimum for noticeable improvement."""
    },
    {
        "condition_name": "Oily Skin / Seborrhea",
        "category": "Sebaceous",
        "fitzpatrick_relevance": "Oily skin and enlarged pores are common across all skin tones. In darker skin tones, oiliness may contribute to acne and PIH. Sebaceous hyperplasia appears as yellowish papules, more visible on lighter skin.",
        "content": """Oily skin results from overactive sebaceous glands producing excess sebum.
Characteristics: shiny appearance, enlarged pores, prone to acne, blackheads, whiteheads.
Contributing factors: genetics, hormones (androgens), humidity, diet, comedogenic skincare products.
Skincare approach: Cleansing — use gentle foaming or gel cleanser twice daily. Avoid over-cleansing which triggers rebound oiliness.
Toners — niacinamide, salicylic acid, witch hazel can help control oil.
Moisturizer — still essential even for oily skin. Use lightweight, oil-free, non-comedogenic formulas.
SPF — gel or fluid sunscreens are best for oily skin types.
Active ingredients: Niacinamide (reduces sebum production), Salicylic acid (BHA, exfoliates inside pores), 
Retinoids (regulate sebum, prevent comedone formation), Clay masks (absorb excess oil).
Avoid: heavy oils, occlusive moisturizers, alcohol-based products (cause rebound oiliness).
T-zone control: blotting papers, mattifying primers, clay-based products for midday oil control.
Diet: some evidence that high glycemic foods and dairy increase sebum production."""
    },
    {
        "condition_name": "Dry Skin / Xerosis",
        "category": "Barrier Dysfunction",
        "fitzpatrick_relevance": "Darker skin tones may show ashy or grey appearance with dryness (due to light scattering from surface scale). Xerosis is common in individuals of African descent and may require heavier emollients.",
        "content": """Xerosis (dry skin) is characterized by reduced water content in the stratum corneum.
Symptoms: tightness, flaking, scaling, rough texture, itching, cracking (fissures in severe cases).
Causes: low humidity, cold weather, hot showers, harsh soaps, aging, underlying conditions (hypothyroidism, diabetes, atopic dermatitis).
Skin barrier components: ceramides (50%), cholesterol (25%), free fatty acids (15%) form the lipid bilayer.
Treatment approach: Moisturizers — apply within 3 minutes of bathing to lock in moisture.
Occlusives: petrolatum, mineral oil, beeswax — seal moisture in (best for very dry skin).
Emollients: fatty acids, ceramides — soften and smooth skin.
Humectants: glycerin, hyaluronic acid, urea — draw water into skin.
Ceramide-containing moisturizers (CeraVe, Eucerin) help repair barrier directly.
Urea (10-40%): keratolytic and humectant. Excellent for very dry/thickened skin. Higher concentrations for heels.
Lactic acid (5-12%): gentle exfoliant and humectant.
Bathing: lukewarm (not hot) water, gentle non-soap cleansers, pat dry (don't rub), immediate moisturizer application.
Avoid: fragranced products, alcohol-based products, harsh soaps.
Environmental: humidifier in dry environments, avoid direct heat sources."""
    },
    {
        "condition_name": "Keratosis Pilaris",
        "category": "Keratinization",
        "fitzpatrick_relevance": "More visible on lighter skin as red/pink bumps. In darker skin tones, the bumps are skin-colored or darker and may be associated with PIH. Common in people of African, East Asian, and Celtic descent.",
        "content": """Keratosis pilaris (KP) is a benign condition characterized by rough, bumpy skin from keratin plugs in hair follicles.
Appearance: small, rough bumps (like sandpaper) around hair follicles. May be skin-colored, red, or brown.
Common locations: upper outer arms, thighs, cheeks, buttocks.
Pathophysiology: excess keratin accumulates in hair follicles → plugs → perifollicular inflammation.
Associated with: atopic dermatitis, ichthyosis vulgaris, dry skin.
Treatment: No cure, but manageable with consistent care.
Exfoliants: Lactic acid (AmLactin 12%) — most effective, humectant + keratolytic.
Urea (10-20%) — softens keratin plugs. 
Salicylic acid — BHA, oil-soluble, penetrates follicles.
Alpha hydroxy acids (glycolic, lactic acid) — exfoliate surface cells.
Retinoids — normalize keratinization over time.
Moisturizers: essential, apply daily. Ceramide-rich formulas preferred.
Physical exfoliation: gentle loofahs or exfoliating cloths — avoid aggressive scrubbing.
Results: improvement takes 1-3 months of consistent treatment.
Condition often improves naturally in adulthood. Worse in winter/dry conditions.
Avoid: hot showers, harsh soaps, picking at bumps (worsens PIH in darker skin)."""
    },
    {
        "condition_name": "Periorbital Hyperpigmentation (Dark Circles)",
        "category": "Pigmentation",
        "fitzpatrick_relevance": "Constitutional periorbital hyperpigmentation is particularly common in South Asian, Middle Eastern, and African populations (Fitzpatrick Types III-VI) and is often hereditary.",
        "content": """Periorbital hyperpigmentation (dark circles) refers to darkening of the skin around the eyes.
Causes: Constitutional/genetic (most common in darker skin tones), vascular (blood pooling, thin skin showing vessels),
Post-inflammatory (eczema, contact dermatitis), shadowing from anatomical features (tear troughs), 
Allergic (allergic shiners), lifestyle (sleep deprivation, dehydration, smoking).
Assessment: Pull skin gently — if color fades, vascular component predominant. If persists, pigmentary component.
Treatment by type:
Pigmentary: topical brighteners (niacinamide, vitamin C, kojic acid, retinoids, azelaic acid).
Hydroquinone under medical supervision. Chemical peels for stubborn pigmentation.
Vascular: caffeine (vasoconstriction), vitamin K, cold compresses, adequate sleep.
Volume loss: hyaluronic acid fillers (medical procedure) for deep tear troughs.
General: SPF protection crucial. Tinted sunscreens with iron oxides protect against visible light.
Vitamin C serum in morning + retinoid at night is effective combination.
Eye creams with peptides may help with skin thickness over time.
Timeline: 3-6 months for noticeable improvement with topicals. Realistic expectations important."""
    },
    {
        "condition_name": "Enlarged Pores",
        "category": "Sebaceous",
        "fitzpatrick_relevance": "Enlarged pores are common across all skin tones. More noticeable on oily skin types regardless of Fitzpatrick classification.",
        "content": """Enlarged pores are a common cosmetic concern, most visible on the nose, cheeks, and forehead.
Causes: excess sebum production, reduced skin elasticity (aging), sun damage, genetics, comedones.
Important note: pores cannot physically be permanently reduced in size, but their appearance can be minimized.
Contributing factors: oily skin (stretches pore openings), aging (collagen loss reduces pore support), sun damage.
Treatment approach:
Salicylic acid (BHA, 0.5-2%): oil-soluble, penetrates and clears pores. Best active ingredient for pore concerns.
Niacinamide (10%): reduces sebum production, improves skin texture, minimizes pore appearance.
Retinoids: increase collagen production, normalize keratinization, reduce pore appearance over time.
Clay masks: temporary — absorb excess sebum, temporarily reduce pore visibility.
AHA exfoliants: remove surface dead skin cells, improve overall texture.
Professional treatments: chemical peels, microneedling, laser resurfacing for significant improvement.
Skincare routine: double cleanse (oil cleanser + water-based cleanser) to fully remove sebum from pores.
Non-comedogenic products: essential to prevent pore blockage.
SPF: daily sunscreen prevents UV-induced collagen degradation that worsens pore appearance.
Makeup: silicone-based primers temporarily fill pores for smooth appearance."""
    },
    {
        "condition_name": "Hypopigmentation",
        "category": "Pigmentation",
        "fitzpatrick_relevance": "More visible and distressing in Fitzpatrick Types IV-VI due to contrast with surrounding skin. Causes include tinea versicolor, vitiligo, post-inflammatory hypopigmentation, pityriasis alba.",
        "content": """Hypopigmentation is a reduction in skin color due to decreased melanin production or melanocyte loss.
Common causes: Post-inflammatory hypopigmentation (PIH-hypo), Vitiligo, Tinea versicolor, 
Pityriasis alba, Chemical leukoderma, Idiopathic guttate hypomelanosis.
Post-inflammatory hypopigmentation: follows inflammation/injury. Usually temporary (months to years).
Treatment: address underlying cause, sun protection, patience. Topical tacrolimus may help repigmentation.
Pityriasis alba: common in children/young adults. Dry, slightly scaly hypopigmented patches on face.
Management: moisturizers, mild topical steroids for inflammation, sun protection.
Differentiation from vitiligo: Wood's lamp — vitiligo shows bright white (chalk-white) fluorescence due to complete melanocyte loss.
Vitiligo: autoimmune destruction of melanocytes. Requires separate management protocol.
Treatment timeline: hypopigmentation from inflammation typically resolves with time and removal of trigger.
Repigmentation starts from follicular units (pigmented dots within hypopigmented areas) — a positive sign.
Sun exposure note: hypopigmented areas don't tan and are more susceptible to UV damage — SPF essential."""
    },
    {
        "condition_name": "Vitiligo",
        "category": "Pigmentation",
        "fitzpatrick_relevance": "Vitiligo affects all skin tones equally in prevalence but is more psychologically distressing in darker skin tones due to greater contrast. Early diagnosis is important as treatment is more effective on early lesions.",
        "content": """Vitiligo is an autoimmune condition causing progressive depigmentation due to melanocyte destruction.
Prevalence: affects ~1% of world population regardless of skin tone or ethnicity.
Types: Segmental (unilateral, stable, follows dermatome), Non-segmental/Generalized (bilateral, progressive).
Appearance: well-defined chalk-white macules and patches. Hairs within patches may also depigment (leukotrichia).
Common locations: perioral, periorbital, hands/fingers, genitalia, elbows, knees, trunk.
Associated autoimmune conditions: thyroid disease (most common), type 1 diabetes, rheumatoid arthritis, alopecia areata.
Diagnosis: Wood's lamp (brilliant white fluorescence), dermoscopy, biopsy if uncertain.
Treatment: Topical — first line: tacrolimus 0.1% or pimecrolimus (calcineurin inhibitors), especially for face/skin folds.
Topical corticosteroids for body areas. Ruxolitinib cream (JAK inhibitor) — recently approved.
Phototherapy: NB-UVB phototherapy (most effective non-surgical treatment). PUVA (psoralen + UVA).
Systemic: oral mini-pulse corticosteroids to stop progression. Oral JAK inhibitors (ruxolitinib) in trials.
Surgical: autologous skin grafting, melanocyte transplantation (stable vitiligo only).
Repigmentation: starts perifollicularly. Face responds better than hands/feet.
Psychosocial support: important component of management, especially in darker skin tones."""
    },
    {
        "condition_name": "Sunburn and UV Damage",
        "category": "UV Damage",
        "fitzpatrick_relevance": "Fitzpatrick Types I-II are highest risk for sunburn and skin cancer. However, Types IV-VI are NOT immune — UV damage causes PIH, melasma, and skin cancer (often diagnosed later due to lower index of suspicion).",
        "content": """Sunburn is acute UV radiation-induced inflammatory skin injury.
Pathophysiology: UVB primarily → DNA damage → inflammatory cascade → prostaglandin release → erythema, pain.
Fitzpatrick skin type determines UV sensitivity:
Type I: always burns, never tans (very fair, red/blonde hair, blue eyes).
Type II: usually burns, tans minimally (fair skin, blue/green eyes).
Type III: sometimes burns, tans uniformly (medium skin).
Type IV: rarely burns, always tans (olive/light brown skin).
Type V: very rarely burns (brown skin).
Type VI: never burns (dark brown/black skin) — but still requires sun protection.
Sunburn treatment: cool compresses, moisturizers (aloe vera, ceramides), NSAIDs (ibuprofen) for pain/inflammation.
Avoid further sun exposure until healed. Stay hydrated.
Chronic UV damage: photoaging (wrinkles, laxity), solar lentigines, actinic keratoses, skin cancer risk.
Sunscreen: SPF 30+ daily for all skin tones. SPF 50+ for outdoor activities.
Broad-spectrum (UVA + UVB) protection essential.
Reapply every 2 hours when outdoors. 1/4 teaspoon for face and neck.
Mineral sunscreens (zinc oxide, titanium dioxide): photostable, broad-spectrum, better for sensitive skin.
Chemical sunscreens: lighter texture, better cosmetic elegance for daily use.
Tinted sunscreens with iron oxides: protect against visible light (important for melasma/PIH management)."""
    },
    {
        "condition_name": "Fungal Acne (Malassezia Folliculitis)",
        "category": "Fungal",
        "fitzpatrick_relevance": "Common in all skin tones. More prevalent in tropical climates and in individuals who sweat heavily. In darker skin tones, the resulting PIH from follicular inflammation can be significant.",
        "content": """Malassezia folliculitis (fungal acne) is an infection of hair follicles by Malassezia yeast, often mistaken for bacterial acne.
Appearance: uniform, monomorphic small papules and pustules (1-2mm), intensely itchy.
Key differentiator from bacterial acne: itchiness, uniform lesion size, no comedones, worsens with antibiotics.
Common locations: forehead, cheeks, chest, back, upper arms.
Triggers: hot/humid weather, sweating, occlusive skincare/haircare products, antibiotics (which reduce bacteria that compete with Malassezia), immunosuppression.
Diagnosis: KOH preparation or dermoscopy. Responds poorly to standard acne treatment.
Treatment: Topical antifungals — ketoconazole 2% cream or shampoo (use as wash-off treatment on affected areas).
Clotrimazole, miconazole, ciclopirox alternatives.
Oral antifungals — fluconazole or itraconazole for severe/extensive cases.
Sulfur-containing products can help.
Skincare review: eliminate comedogenic/occlusive products. Oil-free, non-comedogenic formulas.
Avoid: fatty acids (lauric acid, oleic acid) in skincare — feed Malassezia.
Safe oils: squalane, mineral oil. Problematic oils: coconut, olive, sunflower.
Maintenance: antifungal wash 1-2x/week after clearance to prevent recurrence."""
    },
    {
        "condition_name": "Facial Hyperpigmentation in Skin of Color",
        "category": "Pigmentation",
        "fitzpatrick_relevance": "Specific guidance for Fitzpatrick Types III-VI where facial hyperpigmentation is a primary concern and treatment must be carefully calibrated to avoid worsening.",
        "content": """Facial hyperpigmentation in skin of color requires a culturally competent, tailored approach.
Prevalence: hyperpigmentation is the #1 dermatology concern for patients with skin of color globally.
Common types: Post-inflammatory hyperpigmentation (PIH), melasma, periorbital hyperpigmentation, friction melanosis.
Key principle: any treatment that causes inflammation risks worsening pigmentation in darker skin tones.
Safe first-line ingredients: Niacinamide 4-10% — well-tolerated, reduces melanosome transfer, anti-inflammatory.
Azelaic acid 10-20% — anti-inflammatory + tyrosinase inhibition. Safe for all trimesters of pregnancy.
Vitamin C (L-ascorbic acid) — antioxidant brightening. Can be irritating at high concentrations.
Alpha arbutin 1-2% — gentle tyrosinase inhibitor.
Second-line: Hydroquinone 2-4% — effective but use in cycles. Monitor for ochronosis with long-term use.
Kojic acid — effective but higher sensitization risk.
Tranexamic acid — oral or topical — particularly effective for melasma.
Retinoids — increase cell turnover, fade pigmentation. Start low and slow to avoid retinoid dermatitis.
Caution with: high-concentration AHAs (start low to avoid irritation), aggressive physical exfoliation, 
IPL/laser (high risk of PIH if not performed by experienced provider for skin of color),
Certain chemical peels (must be appropriate strength and type for darker skin).
Essential: SPF 50+ daily. Tinted sunscreen with iron oxides for melasma.
Realistic expectations: 3-6 months minimum for visible improvement. Consistency is key."""
    },
    {
        "condition_name": "Stretch Marks (Striae)",
        "category": "Structural",
        "fitzpatrick_relevance": "Stretch marks are common across all skin tones. In darker skin tones, striae may appear darker (hyperpigmented) or lighter (hypopigmented) and may be more visible due to contrast.",
        "content": """Stretch marks (striae) are dermal scarring from rapid skin stretching beyond elastic capacity.
Types: Striae rubrae (red/purple, active, more treatable), Striae albae (white/silver, mature, harder to treat).
Causes: rapid growth (puberty), pregnancy, rapid weight gain/loss, muscle building, corticosteroid use, Cushing's syndrome.
Pathophysiology: mechanical stretching + corticosteroid effect → dermal collagen and elastin disruption.
Common locations: abdomen, breasts, hips, thighs, buttocks, upper arms.
Prevention: moisturizers (no strong evidence but safe to use), avoiding rapid weight fluctuations.
Treatment of striae rubrae (early/active): Topical retinoids (tretinoin 0.1%) — most evidence for improvement.
Hyaluronic acid topicals — some benefit.
Chemical peels, microneedling — improve texture and color.
Treatment of striae albae (mature): More challenging. Microneedling with radiofrequency, fractional laser, PRP.
Results are improvement, not complete elimination.
Realistic expectations: no treatment completely removes stretch marks. Significant improvement is achievable.
Psychological impact: address body image concerns, normalize their occurrence (affects ~80% of people)."""
    },
    {
        "condition_name": "Ingrown Hairs (Pseudofolliculitis Barbae)",
        "category": "Hair",
        "fitzpatrick_relevance": "Pseudofolliculitis barbae (PFB) is disproportionately common in individuals of African descent (Fitzpatrick Types V-VI) due to curved hair follicles that cause curly hairs to re-enter the skin after shaving.",
        "content": """Pseudofolliculitis barbae (PFB) is a chronic inflammatory condition caused by ingrown hairs, particularly after shaving.
Pathophysiology: curved hair shafts (common in tightly coiled hair) re-enter skin after shaving → foreign body reaction → papules, pustules, PIH.
Predominantly affects: African American men in beard area, but also affects women (bikini area, legs) of all ethnicities.
Appearance: inflammatory papules and pustules in shaved areas, often with significant PIH.
Severity: ranges from mild (few papules) to severe (extensive scarring, keloids).
Prevention (most important): 
Electric razor or clippers (not close shave) — leaves hair slightly above skin surface.
Single-blade razors if wet shaving — multi-blade razors cut hair below skin level.
Shave in direction of hair growth (not against).
Pre-shave preparation: warm water, gentle exfoliation, shaving gel.
Post-shave: cold water rinse, soothing products (aloe vera, glycerin).
Treatment: 
Topical retinoids (tretinoin) — normalize keratinization, reduce ingrown hair recurrence.
Topical antibiotics (clindamycin) for secondary infection.
Topical eflornithine — reduces hair growth rate.
Salicylic acid or glycolic acid — exfoliants to release trapped hairs.
Chemical depilatories (thioglycolate creams) — cut hair differently than razors.
Laser hair removal (Nd:YAG 1064nm for darker skin) — long-term solution for severe PFB.
PIH management: niacinamide, azelaic acid, vitamin C alongside above treatments."""
    },
    {
        "condition_name": "Keloids and Hypertrophic Scars",
        "category": "Scarring",
        "fitzpatrick_relevance": "Keloids are 15x more common in individuals of African, Asian, and Hispanic descent (Fitzpatrick Types IV-VI). Genetic predisposition is strong. Key prevention: avoid unnecessary skin procedures in keloid-prone individuals.",
        "content": """Keloids are benign fibroproliferative tumors extending beyond original wound boundaries.
Differentiation from hypertrophic scars: Hypertrophic scars stay within wound margins and may regress. 
Keloids extend beyond original wound, rarely regress spontaneously.
Pathophysiology: dysregulated wound healing → excessive collagen deposition → keloid formation.
Common locations: earlobes, shoulders, chest, upper back, jawline (after acne).
Triggers: piercings, surgery, burns, acne, chickenpox scars, insect bites.
Symptoms: firm, raised, shiny scar tissue. May be pruritic, painful, or tender.
Treatment (combination approaches most effective):
Intralesional corticosteroids (triamcinolone 10-40mg/mL): first-line. Flatten and soften keloids. Monthly injections.
Silicone gel sheets/gel: worn 12+ hours/day for months. Evidence-based for both prevention and treatment.
Pressure therapy: earring-type devices for earlobe keloids.
Cryotherapy: liquid nitrogen. More effective for smaller keloids.
Surgical excision: high recurrence rate (50-100%) if used alone. Must combine with adjuvant therapy.
Post-excision radiotherapy: most effective combination for recalcitrant keloids.
Laser therapy: pulsed dye laser for vascular component, fractional laser for texture.
Prevention: avoid unnecessary procedures, use silicone sheeting on new wounds in predisposed individuals."""
    },
    {
        "condition_name": "Acanthosis Nigricans",
        "category": "Metabolic",
        "fitzpatrick_relevance": "Acanthosis nigricans affects all skin tones but is more commonly recognized and diagnosed in darker-skinned individuals. It is a marker of insulin resistance and requires systemic evaluation.",
        "content": """Acanthosis nigricans (AN) is a skin condition characterized by dark, velvety, thickened skin in body folds.
Appearance: hyperpigmented, velvety, thickened plaques. Not scales — more like soft, velvet-like texture.
Common locations: neck (especially posterior), axillae, groin, antecubital fossae, knuckles.
Causes: Insulin resistance (most common) — obesity, type 2 diabetes, PCOS, metabolic syndrome.
Rarely: malignancy (paraneoplastic AN), medications (corticosteroids, niacin, oral contraceptives).
Significance: AN is a cutaneous marker of systemic disease — primarily insulin resistance.
Investigation: fasting glucose, HbA1c, lipid panel, consider PCOS workup in women.
Treatment: address underlying cause is primary treatment.
Weight loss and improved insulin sensitivity → significant improvement in AN.
Topical: retinoids, keratolytics (salicylic acid, urea, lactic acid) improve texture and appearance.
Topical vitamin D analogues, glycolic acid peels have some evidence.
Dermabrasion or laser for refractory cases.
Important: cosmetic treatment alone is insufficient — metabolic evaluation and management essential.
Differentiate from: confluent and reticulated papillomatosis (CARP), Dowling-Degos disease."""
    },
    {
        "condition_name": "Perioral Dermatitis",
        "category": "Inflammatory",
        "fitzpatrick_relevance": "Perioral dermatitis affects all skin tones. In darker skin, lesions may appear more hyperpigmented and PIH is common. Important not to confuse with acne around the mouth.",
        "content": """Perioral dermatitis is a facial rash involving small inflammatory papules and pustules around the mouth.
Appearance: clusters of small (1-2mm) red papules and pustules on erythematous or skin-colored base.
Distribution: perioral (sparing vermilion border), perinasal, periorbital extensions possible.
Causes: topical corticosteroid use (most common trigger), fluorinated toothpaste, heavy occlusive moisturizers/makeup.
Pathophysiology: not fully understood. Possible Demodex mite, Candida, and Fusobacterium involvement.
Important: topical steroids temporarily suppress but ultimately worsen perioral dermatitis — key clinical trap.
Treatment: 
Stop all topical corticosteroids immediately (may worsen initially — "steroid withdrawal flare").
Stop fluorinated toothpaste, heavy moisturizers, occlusive products.
Topical: metronidazole 0.75-1% gel, erythromycin, clindamycin, azelaic acid, tacrolimus/pimecrolimus.
Oral antibiotics: doxycycline 100mg or tetracycline 500mg for 6-12 weeks for moderate-severe cases.
Oral isotretinoin for refractory cases.
Resolution: most cases resolve in 1-3 months with appropriate treatment. Recurrence possible.
Differentiate from: acne (comedones present), rosacea (central face, flushing), seborrheic dermatitis (different distribution)."""
    },
    {
        "condition_name": "Dehydrated Skin",
        "category": "Barrier Dysfunction",
        "fitzpatrick_relevance": "Dehydration affects all skin tones equally. However, dehydration may contribute to more visible ashy appearance in darker skin tones.",
        "content": """Dehydrated skin refers to skin lacking adequate water content in the stratum corneum (distinct from dry skin which lacks oil).
Note: dehydrated skin is a temporary skin condition, not a skin type. Even oily skin can be dehydrated.
Signs: tightness, dullness, fine lines (especially when skin is pinched), rough texture, increased sensitivity.
Pinch test: pinch skin on cheek — if it takes time to bounce back, dehydration likely.
Causes: inadequate water intake, harsh cleansers, over-exfoliation, low humidity, hot showers, alcohol consumption, caffeine.
Treatment: 
Humectants: hyaluronic acid (multiple molecular weights for layered hydration), glycerin, panthenol, aloe vera.
Application: apply hyaluronic acid to damp skin then seal with moisturizer.
Barrier repair: ceramide moisturizers to reduce transepidermal water loss.
Internal hydration: 8+ glasses water daily. Electrolytes help retain hydration.
Reduce: over-exfoliation, hot showers, alcohol/caffeine intake.
Add: humidifier in dry environments.
Lifestyle: adequate sleep, stress management (cortisol impairs barrier function).
Skincare routine adjustment: gentle cleanser, hydrating toner/essence, hyaluronic acid serum, moisturizer, SPF.
Timeline: dehydration can improve within days with proper hydration and barrier care."""
    },
    {
        "condition_name": "Sun Protection and SPF",
        "category": "Prevention",
        "fitzpatrick_relevance": "All Fitzpatrick skin types require sun protection. Common misconception that darker skin tones don't need SPF — UV causes PIH, melasma, and skin cancer in all skin tones. Visible light also contributes to hyperpigmentation in darker skin.",
        "content": """Sun protection is the cornerstone of skin health and the #1 anti-aging and anti-hyperpigmentation intervention.
SPF (Sun Protection Factor): measures protection against UVB (burning) rays.
SPF 15 blocks ~93% UVB. SPF 30 blocks ~97% UVB. SPF 50 blocks ~98% UVB.
Broad-spectrum: protects against both UVA (aging, pigmentation, skin cancer) and UVB.
Types of sunscreen:
Chemical/organic: absorbs UV and converts to heat. Oxybenzone, avobenzone, octinoxate, homosalate.
Lighter texture, cosmetically elegant. Some concerns about hormone disruption with certain filters.
Mineral/physical: zinc oxide and titanium dioxide. Reflects/scatters UV. 
Photostable, broad-spectrum, better for sensitive skin. Can leave white cast — nano/micronized versions reduce this.
Tinted mineral sunscreens: iron oxides protect against visible light (400-700nm) — essential for melasma management.
Application: 1/4 teaspoon for face and neck. Apply as final step in AM skincare, before makeup.
Reapply every 2 hours when outdoors, after swimming/sweating.
Most people apply only 25-50% of required amount — under-application reduces efficacy significantly.
Common mistakes: not applying enough, not reapplying, skipping on cloudy days (UV penetrates clouds), 
skipping on darker skin tones (UV causes PIH and melasma regardless of baseline pigmentation).
UVA penetrates glass — car windows, office windows. Consider UVA protection daily.
Blue light from screens contributes minimally to hyperpigmentation compared to solar UV."""
    },
    {
        "condition_name": "Antioxidants in Skincare",
        "category": "Active Ingredients",
        "fitzpatrick_relevance": "Antioxidants are beneficial for all skin tones. For darker skin tones, vitamin C is particularly valuable for brightening and PIH management.",
        "content": """Antioxidants neutralize free radicals generated by UV exposure, pollution, and metabolic processes.
Key antioxidants in skincare:
Vitamin C (L-ascorbic acid): most studied. Inhibits melanin synthesis, boosts collagen, photoprotective.
Effective at 10-20%. pH must be <3.5 for stability. Oxidizes quickly — store in dark, cool place.
Vitamin C derivatives: ascorbyl glucoside, magnesium ascorbyl phosphate — more stable, slightly less potent.
Vitamin E (tocopherol): fat-soluble antioxidant. Synergistic with vitamin C (recycling effect).
Niacinamide: antioxidant + anti-inflammatory + melanin transfer inhibitor.
Resveratrol: potent antioxidant from red grapes. Emerging evidence for photoprotection.
Ferulic acid: plant-based antioxidant. Stabilizes vitamin C and E, boosts their efficacy significantly.
Coenzyme Q10: antioxidant, may support collagen production.
Green tea extract (EGCG): anti-inflammatory and antioxidant properties.
Classic combination: vitamin C 15-20% + vitamin E 1% + ferulic acid — gold standard morning antioxidant serum.
Application timing: antioxidants generally used in morning routine after cleansing, before moisturizer and SPF.
They complement (not replace) sunscreen by providing additional photoprotection.
Stability: vitamin C in particular is unstable. Signs of oxidation: yellow → orange → brown discoloration.
Introduce gradually, especially pure L-ascorbic acid which can cause tingling on sensitive skin."""
    },
    {
        "condition_name": "Retinoids in Skincare",
        "category": "Active Ingredients",
        "fitzpatrick_relevance": "Retinoids are effective for all skin tones but must be introduced carefully in darker skin tones to avoid retinoid dermatitis, which can trigger PIH. Start with low concentrations and build up gradually.",
        "content": """Retinoids are vitamin A derivatives — the most evidence-based anti-aging and acne treatment in dermatology.
Types (from strongest/most irritating to gentlest):
Tretinoin (prescription): most studied. 0.025%, 0.05%, 0.1% strengths.
Tazarotene (prescription): strongest topical retinoid. 0.05%, 0.1%.
Adapalene (prescription/OTC 0.1%): well-tolerated, specifically targets acne.
Retinol (OTC): converted to retinoic acid in skin. 0.025-1% typical range.
Retinaldehyde: intermediate between retinol and retinoic acid. Less irritating than tretinoin.
Retinyl esters (retinyl palmitate, acetate): weakest, most gentle. Good for beginners.
Evidence-based benefits: stimulates collagen synthesis, increases cell turnover, reduces fine lines/wrinkles,
treats acne (normalizes keratinization), fades hyperpigmentation, improves photoaging.
How to start: begin 1-2x/week, gradually increase frequency over weeks/months.
Use at night (photosensitive). Pea-sized amount for entire face.
Expect purging (initial acne worsening): 4-8 weeks then improves.
Retinoid dermatitis: dryness, redness, flaking — manage with moisturizer, reduce frequency.
Sandwich method: apply moisturizer, then retinoid on top — reduces irritation.
Contraindicated in pregnancy. Use effective contraception.
Sun sensitivity increased — daily SPF essential during retinoid use.
Patience: 3-6 months minimum for noticeable anti-aging/brightening results."""
    },
    {
        "condition_name": "Chemical Exfoliants (AHAs and BHAs)",
        "category": "Active Ingredients",
        "fitzpatrick_relevance": "Darker skin tones (Fitzpatrick IV-VI) should start with lower concentrations and frequencies to avoid over-exfoliation which can trigger PIH. AHAs are particularly useful for surface brightening and PIH treatment.",
        "content": """Chemical exfoliants dissolve the bonds between dead skin cells for smoother, brighter skin.
Alpha Hydroxy Acids (AHAs): water-soluble, work on skin surface.
Glycolic acid: smallest molecule, deepest penetration. 5-15% in leave-on products, up to 70% in professional peels.
Lactic acid: larger molecule, gentler. Humectant properties. Good starting point.
Mandelic acid: largest AHA molecule, gentlest. Good for sensitive/darker skin tones.
Malic, tartaric, citric acids: less commonly used.
Benefits: exfoliation, brightening, PIH improvement, texture refinement, stimulates collagen.
Beta Hydroxy Acids (BHAs): oil-soluble, penetrates hair follicles.
Salicylic acid (0.5-2%): clears pores, anti-inflammatory, anti-comedonal. Best for acne/oily skin.
How to use: start 1-2x/week. Increase as tolerated. Use in evening.
Apply to clean, dry skin. Wait 20-30 minutes before applying other products if sensitive.
Important for darker skin: over-exfoliation causes inflammation → PIH. Less is more.
Signs of over-exfoliation: persistent redness, sensitivity, burning, breakouts.
Don't combine multiple acids in same routine initially.
Avoid with retinoids simultaneously (do not apply together same night — alternate or separate AM/PM).
SPF mandatory when using AHAs — they increase photosensitivity.
Professional peels: much higher concentrations, performed by dermatologists. 
Higher risk of PIH in darker skin — only with experienced provider."""
    },
    {
        "condition_name": "Moisturizers and Skin Barrier",
        "category": "Skincare Fundamentals",
        "fitzpatrick_relevance": "All skin tones benefit from barrier support. Darker skin may have lower ceramide levels and higher transepidermal water loss in some populations, making moisturizer selection important.",
        "content": """The skin barrier (stratum corneum) is the outermost protective layer — critical for skin health.
Healthy barrier: retains moisture, protects against irritants/allergens/pathogens, prevents water loss.
Compromised barrier: dryness, sensitivity, inflammation, increased infection risk, eczema flares.
Moisturizer components:
Humectants: draw water into skin. Hyaluronic acid, glycerin, urea (low concentration), panthenol, aloe vera.
Emollients: fill gaps between skin cells, smooth surface. Fatty acids, ceramides, squalane, shea butter.
Occlusives: seal surface to prevent water loss. Petrolatum (most effective), mineral oil, beeswax, dimethicone.
Ceramides: naturally occurring lipids in skin barrier. Products with ceramides (CeraVe) directly replenish.
Key ingredients for barrier repair: ceramides, cholesterol, free fatty acids (ideally in 3:1:1 ratio), niacinamide.
When to apply: immediately after cleansing/bathing on slightly damp skin for best absorption.
Choosing moisturizer by skin type:
Dry skin: thicker creams, ointments. Petrolatum-based for very dry areas.
Oily skin: lightweight gel-creams, oil-free formulas. Don't skip — dehydration triggers more oil.
Sensitive skin: fragrance-free, hypoallergenic, minimal ingredients.
Normal/combination: medium-weight lotions.
Morning vs evening: lighter formulas for day (under SPF), richer formulas at night for repair.
Common mistakes: using fragranced products (irritate barrier), skipping moisturizer on oily skin, applying to completely dry skin."""
    },
    {
        "condition_name": "Cleansing and Skin pH",
        "category": "Skincare Fundamentals",
        "fitzpatrick_relevance": "Over-cleansing is a concern for all skin tones. Harsh soaps can disrupt the acid mantle and trigger compensatory oil production or irritation, leading to acne and PIH in darker skin tones.",
        "content": """Proper cleansing removes dirt, oil, makeup, sunscreen, and pollutants while preserving the skin barrier.
Skin pH: naturally slightly acidic at 4.5-5.5 (acid mantle). This protects against pathogens and supports barrier function.
Traditional bar soaps: pH 9-11 — too alkaline, disrupts acid mantle, strips natural oils.
Facial cleansers: ideally pH 4.5-6.5 to respect skin's natural pH.
Types of cleansers:
Gel/foaming cleansers: best for oily/acne-prone skin. Removes excess sebum effectively.
Cream/lotion cleansers: for dry/sensitive skin. Less stripping.
Micellar water: gentle, no-rinse option. Good for sensitive skin or eye makeup removal.
Oil cleansers: first step in double cleanse. Dissolves oil-based products (sunscreen, makeup).
Cleansing balms: similar to oil cleansers in efficacy.
Double cleansing: oil cleanser (removes SPF/makeup) → water-based cleanser (cleans skin).
Recommended for evening if wearing SPF/makeup. Not necessary in morning.
Frequency: twice daily (morning and evening) for most skin types.
Over-cleansing signs: tightness after washing, excessive dryness, rebound oiliness, sensitivity.
If this occurs: reduce to once daily or use micellar water in morning.
Water temperature: lukewarm. Hot water strips oils and dilates capillaries (problematic for rosacea).
Avoid: physical scrubs with harsh particles (micro-tears), fragranced cleansers on sensitive skin, 
rubbing (pat dry gently instead)."""
    },
    {
        "condition_name": "Niacinamide",
        "category": "Active Ingredients",
        "fitzpatrick_relevance": "Niacinamide is one of the best-tolerated and most versatile active ingredients for all Fitzpatrick skin types, particularly beneficial for darker skin tones managing PIH, oiliness, and barrier function.",
        "content": """Niacinamide (vitamin B3) is one of the most versatile and well-tolerated skincare actives.
Mechanisms of action: inhibits melanosome transfer (reduces hyperpigmentation), reduces sebum production,
anti-inflammatory, strengthens skin barrier (increases ceramide synthesis), antioxidant.
Evidence-based benefits:
Hyperpigmentation: 4-10% niacinamide reduces PIH and melasma with 8-12 weeks use.
Acne: reduces oil production, anti-inflammatory, reduces acne lesion count.
Enlarged pores: reduces sebum → minimizes pore appearance.
Skin barrier: increases ceramide production, reduces transepidermal water loss.
Redness and sensitivity: anti-inflammatory, reduces skin reactivity.
Anti-aging: antioxidant properties, may stimulate collagen.
Concentrations: 2-5% gentle, 10% for stronger effects. 20%+ may cause irritation (skin flushing).
Formulation: highly stable across pH range. Compatible with most other ingredients.
Combining: works synergistically with vitamin C (contrary to old myth, combination is effective and safe).
Pairs well with: hyaluronic acid, retinoids, AHAs/BHAs, peptides.
Side effects: rare at 2-5%. Higher concentrations (20%+) may cause flushing due to nicotinic acid conversion.
Application: morning and/or evening. Well-tolerated for twice daily use.
Timeline: 4-8 weeks for visible improvements in hyperpigmentation and oil control."""
    },
    {
        "condition_name": "Hyaluronic Acid",
        "category": "Active Ingredients",
        "fitzpatrick_relevance": "Hyaluronic acid is beneficial for all Fitzpatrick skin types and all skin concerns as a hydration ingredient.",
        "content": """Hyaluronic acid (HA) is a naturally occurring glycosaminoglycan and the gold standard humectant in skincare.
Natural function: found throughout the body (skin, joints, eyes). Holds up to 1000x its weight in water.
Molecular weights in skincare:
High molecular weight HA: stays on skin surface, provides immediate plumping, less penetration.
Medium molecular weight: penetrates upper layers of skin.
Low molecular weight: penetrates deeper, provides deeper hydration but may cause inflammation in some.
Cross-linked HA (in serums): designed for extended release.
Multiple molecular weight products: most comprehensive hydration.
How to apply: apply to damp skin (just misted with water or immediately after cleansing). 
If applied to dry skin in low-humidity environments, HA can pull moisture from deeper skin layers — counterproductive.
Seal with moisturizer or oil to prevent evaporation.
Benefits: immediate plumping of fine lines (cosmetic effect), hydration, supports barrier function.
Not a permanent filler — effects last while the HA is on the skin, fade after washing off.
Long-term use supports skin barrier health and reduces irritation from other actives.
Sodium hyaluronate: salt form of HA. Same function, slightly better stability and penetration.
Side effects: rare. Occasional breakouts in acne-prone if product is heavy or contains other pore-clogging ingredients.
Stackable: safe to use alongside all other active ingredients."""
    },
    {
        "condition_name": "Azelaic Acid",
        "category": "Active Ingredients",
        "fitzpatrick_relevance": "Azelaic acid is particularly valuable for darker skin tones due to its dual action on both acne and hyperpigmentation with minimal risk of triggering PIH. One of the safest options for Fitzpatrick Types IV-VI.",
        "content": """Azelaic acid is a naturally occurring dicarboxylic acid with multiple beneficial skin effects.
Sources: found naturally in wheat, rye, barley. Produced by Malassezia yeast on skin.
Mechanisms: tyrosinase inhibition (reduces melanin synthesis), anti-inflammatory (reduces IL-1, TNF-α),
anti-comedonal (normalizes keratinization), antibacterial (particularly against C. acnes).
Concentrations: OTC products: 5-10%. Prescription: 15-20% (most studied concentrations).
FDA-approved for: acne and rosacea (Finacea 15% gel, Azelex 20% cream).
Off-label use: melasma, PIH — well-supported by evidence.
Evidence-based indications: acne, rosacea, melasma, PIH, perioral dermatitis.
Advantages over other actives: safe in pregnancy (Category B), minimal risk of PIH in darker skin,
anti-inflammatory (unlike some other brighteners), effective against both inflammatory and non-inflammatory acne.
Formulations: gel (better for oily/acne-prone), cream (better for dry/sensitive), foam.
Application: once or twice daily. Can cause mild tingling initially — usually resolves with continued use.
If tingling persists: reduce frequency or mix with moisturizer.
Timeline: 4-8 weeks for acne improvement, 12-16 weeks for pigmentation improvement.
Combining: safe with most actives. Pairs well with niacinamide, vitamin C, retinoids, SPF.
Side effects: mild tingling/burning initially, rare contact dermatitis."""
    },
    {
        "condition_name": "Sensitive Skin",
        "category": "Skin Type",
        "fitzpatrick_relevance": "Sensitive skin characteristics affect all Fitzpatrick types. However, the presentation may differ — in darker skin, sensitivity may manifest as hyperpigmented patches rather than redness.",
        "content": """Sensitive skin is characterized by heightened reactivity to environmental factors and skincare products.
Features: stinging, burning, itching, or tightness in response to products or environmental triggers.
Redness, flushing, or patches of irritation.
Subtypes: rosacea-related sensitivity, atopic skin (eczema-related), reactive skin (cosmetic intolerance), acne-prone sensitive.
Common triggers: fragrances, essential oils, alcohol (denat), harsh surfactants, physical exfoliants, 
high concentration actives, temperature changes, UV exposure, stress.
Patch testing: before introducing new products, test on inner arm for 24-48 hours.
Skincare approach:
Cleanser: gentle, fragrance-free, pH-balanced. Micellar water or gentle cream cleanser.
Moisturizer: fragrance-free, minimal ingredients, barrier-supporting (ceramides, fatty acids).
Actives: introduce one at a time, start with lower concentrations, build slowly.
SPF: mineral (zinc oxide) sunscreen — less irritating than chemical filters for sensitive skin.
Avoid: fragrance (biggest sensitizer), essential oils (citrus, lavender can sensitize), alcohol,
physical scrubs, high-concentration AHAs/BHAs, retinoids without careful introduction.
Ingredient checklist to avoid: parfum/fragrance, limonene, linalool, cinnamal, sodium lauryl sulfate.
Best-tolerated actives: niacinamide, azelaic acid, low-concentration lactic acid, ceramides.
Simplify routine: fewer products, fewer ingredients, less irritation.
Building tolerance: introduce actives very gradually over weeks/months."""
    },
    {
        "condition_name": "Comedones (Blackheads and Whiteheads)",
        "category": "Acne",
        "fitzpatrick_relevance": "Comedonal acne affects all skin tones. In darker skin, the resulting PIH from extraction or inflammation is a significant concern — gentle extraction methods and anti-inflammatory treatment preferred.",
        "content": """Comedones are non-inflammatory acne lesions formed by follicular plugging.
Types:
Open comedones (blackheads): follicle opening is open, trapped sebum oxidizes → black color (not dirt).
Closed comedones (whiteheads): follicle opening closed by skin, trapped sebum appears white/flesh-colored.
Microcomedones: invisible precursor to both types.
Pathophysiology: androgens stimulate sebum → excess sebum + dead skin cells → follicular plug.
Contributing factors: genetics, androgen sensitivity, comedogenic products, certain medications.
Treatment:
Topical retinoids: most effective comedonal acne treatment. Normalize keratinization, prevent new comedones.
Adapalene 0.1%: FDA-approved OTC, specifically targets comedonal acne.
Tretinoin 0.025-0.05%: highly effective, more irritating.
Salicylic acid (BHA, 0.5-2%): oil-soluble, clears pores. In cleansers, toners, leave-on products.
Benzoyl peroxide: primarily antibacterial but helps unclog pores.
Manual extraction: performed by professional esthetician/dermatologist. 
Avoid home extractions — risk of scarring and PIH in darker skin.
Chemical peels: glycolic or salicylic acid peels for significant comedonal acne.
Non-comedogenic products: essential to prevent new comedone formation.
Check product ingredients: avoid coconut oil, isopropyl myristate, algae extract, lanolin on acne-prone skin.
Timeline: retinoids require 8-12 weeks for significant reduction in comedone count."""
    },
    {
        "condition_name": "Lichen Planus",
        "category": "Inflammatory",
        "fitzpatrick_relevance": "Lichen planus is more common in South Asian populations and causes significant hyperpigmentation (lichen planus pigmentosus) in darker skin tones, particularly on face and flexural areas without typical papules.",
        "content": """Lichen planus is a chronic inflammatory condition affecting skin, mucous membranes, nails, and hair.
Classic skin lesion: 4 P's — Planar (flat-topped), Purple, Polygonal Papules. Wickham's striae (white lines on surface).
Common locations: wrists, ankles, lower back, oral mucosa, genitalia.
Variants: Hypertrophic (thick scaly plaques), Atrophic, Bullous, Erosive, Lichen planopilaris (scarring alopecia).
Lichen planus pigmentosus (LPP): variant common in darker skin (Indian subcontinent, Middle East, Latin America).
Presents as grey-brown hyperpigmented patches on face and flexural areas. May occur WITHOUT classic papules.
Pathophysiology: T-cell mediated autoimmune attack on basal keratinocytes.
Associated conditions: hepatitis C (especially erosive oral LP), other autoimmune conditions.
Investigations: liver function tests, hepatitis C serology.
Treatment: 
Cutaneous LP: topical corticosteroids (high potency), topical calcineurin inhibitors.
Systemic: oral corticosteroids for widespread disease, acitretin, methotrexate, hydroxychloroquine.
LPP (pigmentosus): sun protection, topical steroids/calcineurin inhibitors, tranexamic acid for pigmentation.
Oral LP: topical corticosteroids, tacrolimus. Erosive oral LP can be painful and refractory.
Prognosis: skin LP often self-resolves in 1-2 years. Oral and hypertrophic variants more persistent.
Post-inflammatory hyperpigmentation is a major concern and may persist long after resolution."""
    },
    {
        "condition_name": "Pityriasis Rosea",
        "category": "Inflammatory",
        "fitzpatrick_relevance": "In darker skin tones, pityriasis rosea may present with inverse pattern (lesions in axillae/groin rather than trunk) and leave significant PIH that takes months to resolve.",
        "content": """Pityriasis rosea is a self-limiting papulosquamous skin condition, likely triggered by viral reactivation (HHV-6/7).
Presentation: Herald patch (single 2-5cm salmon-colored patch with collarette scale) appears 1-2 weeks before widespread eruption.
Widespread eruption: multiple oval, salmon-colored patches with trailing scale, following skin cleavage lines 
in classic "Christmas tree" pattern on trunk.
Duration: typically self-resolves in 6-12 weeks.
Inverse pattern: more common in darker skin, children, and pregnant women — lesions in axillae, groin, neck.
Symptoms: mild to moderate pruritus. More severe itch in some.
Diagnosis: clinical. Rule out secondary syphilis (similar appearance — check palms and soles, serology if uncertain).
Treatment: 
Mild: reassurance, emollients, moderate potency topical corticosteroids for itch.
Moderate-severe: oral acyclovir (antiviral) may shorten duration.
NB-UVB phototherapy for extensive/pruritic disease.
Antihistamines for itch relief.
PIH management: particularly important in darker skin. SPF protection, niacinamide, azelaic acid post-resolution.
Reassurance: condition is benign and self-limiting. Recurrence is rare (<2%).
Avoid: extensive sun exposure during active disease (may worsen rash and increase PIH risk)."""
    },
    {
        "condition_name": "Hair and Scalp Health",
        "category": "Hair",
        "fitzpatrick_relevance": "Tightly coiled hair (common in individuals of African descent) has unique needs including higher moisture requirements, fragility at points of curl, and specific conditions like traction alopecia and central centrifugal cicatricial alopecia (CCCA).",
        "content": """Hair and scalp health varies significantly by hair texture, type, and individual factors.
Hair types: straight (Type 1), wavy (Type 2), curly (Type 3), coily/kinky (Type 4).
Tightly coiled hair (Type 3C-4C) characteristics: naturally drier (sebum travels slowly down curled shaft),
more fragile due to structural twist points, higher breakage risk with manipulation.
Common scalp conditions: seborrheic dermatitis, psoriasis, tinea capitis, folliculitis, traction alopecia.
Central Centrifugal Cicatricial Alopecia (CCCA): most common form of scarring alopecia in Black women.
Begins at crown, progresses centrifugally. Related to chemical relaxers, heat styling, tight hairstyles.
Treatment: cessation of causative styling, intralesional corticosteroids, topical minoxidil, anti-inflammatory antibiotics.
Traction alopecia: hair loss from chronic tension (tight braids, extensions, weaves, ponytails).
Prevention: avoid tight styles, allow scalp to rest between protective styles.
General scalp care: regular gentle cleansing (every 1-2 weeks for coily hair, more frequently for oily scalps).
Scalp massage: may improve circulation and reduce sebum buildup.
Moisturizing: co-washing (conditioner washing), leave-in conditioners, sealing oils for dry ends.
LOC/LCO method for coily hair: Liquid → Oil → Cream (or Liquid → Cream → Oil) for moisture retention.
Protein treatments: strengthen hair shaft. Balance with moisture (protein-moisture balance).
Heat protection: always use heat protectant before heat styling to reduce damage."""
    },
    {
        "condition_name": "Fitzpatrick Skin Type Classification",
        "category": "Skin Classification",
        "fitzpatrick_relevance": "The Fitzpatrick scale is the foundational classification system for skin phototypes. Understanding a patient's Fitzpatrick type guides treatment selection, UV risk assessment, and anticipation of treatment side effects.",
        "content": """The Fitzpatrick skin phototype scale (1975) classifies skin by response to UV radiation.
Type I: Very fair. Always burns, never tans. Pale white skin, red/blonde hair, blue/green eyes, freckles.
UV sensitivity: extreme. Highest skin cancer risk.
Type II: Fair. Usually burns, tans minimally. White skin, blonde/red hair, blue/hazel eyes.
UV sensitivity: very high. Very high skin cancer risk.
Type III: Medium. Sometimes burns mildly, tans uniformly. White to light brown skin, any hair/eye color.
UV sensitivity: high. High skin cancer risk.
Type IV: Olive/Light brown. Rarely burns, always tans. Mediterranean, East Asian, Latin American skin tones.
UV sensitivity: moderate. Moderate skin cancer risk. Higher PIH risk.
Type V: Brown. Very rarely burns, tans darkly. Middle Eastern, South Asian, some East Asian, some Latin American.
UV sensitivity: low. Lower (but not zero) skin cancer risk. High PIH risk.
Type VI: Dark brown/Black. Never burns. Sub-Saharan African, Australian Aboriginal descent.
UV sensitivity: very low. Skin cancer risk not zero — often diagnosed later due to lower clinical suspicion.
Highest PIH and keloid risk. Vitiligo most psychologically impactful.
Clinical relevance: 
Lower phototypes (I-II): prioritize UV protection, skin cancer screening, photoaging prevention.
Higher phototypes (IV-VI): prioritize PIH prevention/treatment, appropriate selection of procedures 
(laser, peels), awareness of conditions disproportionately affecting skin of color.
Important limitation: Fitzpatrick scale doesn't fully capture diversity of skin of color.
ITA (Individual Typology Angle) and Melanin Index provide more objective measures."""
    },
]

def get_embedding(text: str) -> list:
    """Get embedding from OpenAI API."""
    import openai
    client = openai.OpenAI(api_key=OPENAI_API_KEY)
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding


def insert_condition(condition: dict) -> bool:
    """Insert a single condition into Supabase."""
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    
    # Combine condition name and content for embedding
    embed_text = f"{condition['condition_name']}: {condition['content'][:500]}"
    embedding = get_embedding(embed_text)
    
    payload = {
        "condition_name": condition["condition_name"],
        "category": condition["category"],
        "content": condition["content"],
        "source": "Clinical dermatology guidelines and evidence-based practice",
        "fitzpatrick_relevance": condition["fitzpatrick_relevance"],
        "embedding": embedding,
    }
    
    import httpx
    with httpx.Client() as client:
        res = client.post(
            f"{SUPABASE_URL}/rest/v1/dermatology_kb",
            headers=headers,
            json=payload,
            timeout=30
        )
    
    return res.status_code in [200, 201]


def main():
    print(f"Starting population of dermatology_kb table...")
    print(f"Total conditions to insert: {len(CONDITIONS)}")
    print(f"Supabase URL: {SUPABASE_URL[:40]}...")
    
    if not OPENAI_API_KEY:
        print("ERROR: OPENAI_API_KEY not found in environment variables.")
        print("Add it to your backend/.env file and try again.")
        return
    
    success_count = 0
    fail_count = 0
    
    for i, condition in enumerate(CONDITIONS):
        print(f"[{i+1}/{len(CONDITIONS)}] Inserting: {condition['condition_name']}...", end=" ")
        try:
            success = insert_condition(condition)
            if success:
                print("✅")
                success_count += 1
            else:
                print("❌ Failed")
                fail_count += 1
        except Exception as e:
            print(f"❌ Error: {e}")
            fail_count += 1
        
        # Rate limit: small delay between API calls
        time.sleep(0.3)
    
    print(f"\n{'='*50}")
    print(f"Population complete!")
    print(f"✅ Successfully inserted: {success_count}")
    print(f"❌ Failed: {fail_count}")
    print(f"Total conditions in KB: {success_count}")


if __name__ == "__main__":
    main()
