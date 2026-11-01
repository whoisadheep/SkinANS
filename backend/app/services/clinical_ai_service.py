import os
import json
import logging
from typing import Optional, List, Dict, Any

logger = logging.getLogger("skinans.clinical_ai")

# Comprehensive Clinical Knowledge Base for the 23 Model Classes
DISEASE_KNOWLEDGE_BASE: Dict[str, Dict[str, Any]] = {
    "Acne and Rosacea Photos": {
        "display_name": "Acne Vulgaris & Rosacea",
        "risk_level": "Low",
        "description": "Inflammatory pilosebaceous disorder characterized by comedones, papules, pustules, and facial flushing or vascular reactivity.",
        "tone_guidance": {
            "light": "Erythema presents as visible bright pink to red macules and papules. Telangiectasias (spider veins) are prominent in rosacea subtypes.",
            "medium": "Papules may appear dusky red or brownish with moderate risk of post-inflammatory hyperpigmentation (PIH) after active lesions resolve.",
            "dark": "Erythema may be subtle or absent. Lesions frequently present as hyperpigmented macules, dark brown papules, or post-inflammatory dyschromia. Avoid aggressive physical picking to prevent keloids and stubborn PIH."
        },
        "care_recommendations": [
            "Cleanse gently twice daily with a non-comedogenic, pH-balanced cleanser.",
            "Incorporate targeted topical ingredients such as azelaic acid, salicylic acid, or gentle retinoids as tolerated.",
            "Avoid common rosacea triggers: intense heat, spicy foods, alcohol, and harsh abrasive scrubs.",
            "Apply daily broad-spectrum mineral sunscreen (SPF 30+) to prevent flare-ups and post-inflammatory dark spots."
        ],
        "when_to_see_doctor": [
            "Presence of deep, painful cystic or nodular lesions that do not respond to over-the-counter care.",
            "Significant scarring, pitting, or psychological distress.",
            "Ocular symptoms such as gritty, bloodshot, or irritated eyes (suggesting ocular rosacea)."
        ],
        "red_flags": [
            "Rapidly worsening facial swelling or warmth.",
            "Severe eye pain, photophobia, or vision changes.",
            "High fever accompanying facial pustules."
        ]
    },
    "Actinic Keratosis Basal Cell Carcinoma and other Malignant Lesions": {
        "display_name": "Actinic Keratosis & Malignant Lesions (BCC / Precancerous)",
        "risk_level": "Urgent",
        "description": "Pre-cancerous sun-damaged lesions (Actinic Keratosis) or non-melanoma skin cancer (such as Basal Cell Carcinoma). Requires formal dermatological evaluation and histological confirmation.",
        "tone_guidance": {
            "light": "High epidemiological prevalence in Fitzpatrick I–II due to cumulative UV exposure. Often presents as rough, scaly, sandpaper-like pink patches or pearly nodules with rolled borders.",
            "medium": "Presents as scaly erythematous or pigmented plaques. Pigmented Basal Cell Carcinomas are more frequent in olive/tan skin and can resemble benign seborrheic keratoses.",
            "dark": "Less common but often diagnosed at a later stage due to lower index of suspicion. May present as hyperpigmented, brown, or black translucent nodules with ulceration."
        },
        "care_recommendations": [
            "DO NOT attempt to scratch, scrape, freeze, or treat these lesions with home remedies.",
            "Strictly protect the area from further UV radiation with UPF clothing and SPF 50+ mineral sunscreen.",
            "Photograph the lesion next to a ruler with consistent lighting to document any changes prior to your doctor's visit.",
            "Schedule a prompt dermatological consultation for dermoscopy and biopsy."
        ],
        "when_to_see_doctor": [
            "Any non-healing sore, persistent crusty lesion, or rough patch lasting longer than 4–6 weeks.",
            "A spot that bleeds spontaneously or easily upon slight trauma.",
            "Lesions with pearly translucent borders or central ulceration."
        ],
        "red_flags": [
            "Rapid enlargement over a few weeks.",
            "Continuous or recurrent bleeding from the lesion.",
            "Associated lymph node swelling nearby."
        ]
    },
    "Atopic Dermatitis Photos": {
        "display_name": "Atopic Dermatitis (Eczema)",
        "risk_level": "Moderate",
        "description": "Chronic, pruritic inflammatory skin disease characterized by epidermal barrier dysfunction, intense itching, and recurrent eczematous lesions.",
        "tone_guidance": {
            "light": "Appears as marked pink to bright red xerotic (dry) plaques with fine scaling and excoriations (scratch marks), predominantly in flexural folds.",
            "medium": "Plaques appear reddish-brown with prominent xerosis. Significant risk of post-inflammatory hyperpigmentation following flares.",
            "dark": "Erythema is often violaceous, dark brown, or grayish rather than bright red. Follicular prominence and lichenification (thickened leather-like skin) are prominent. Post-inflammatory hypopigmentation or hyperpigmentation is common."
        },
        "care_recommendations": [
            "Apply thick, ceramide-rich emollient ointments immediately after bathing on damp skin (the 'soak and seal' method).",
            "Take short (5–10 min) lukewarm baths/showers and use soap-free syndet cleansers.",
            "Wear loose, breathable 100% cotton clothing; avoid wool, synthetics, and harsh detergents.",
            "Apply cold compresses or anti-itch calamine/colloidal oatmeal lotions to manage severe pruritus."
        ],
        "when_to_see_doctor": [
            "Itching severely disrupts sleep, concentration, or daily quality of life.",
            "Over-the-counter moisturizers and hydrocortisone fail to clear flare-ups within 1–2 weeks.",
            "Plaques begin weeping, crusting with honey-colored scabs, or become acutely painful."
        ],
        "red_flags": [
            "Widespread punched-out painful blisters with fever (possible Eczema Herpeticum — medical emergency).",
            "Rapidly spreading golden-crusted oozing areas (secondary bacterial impetiginization).",
            "Erythroderma (intense redness/peeling covering >80% of the body surface)."
        ]
    },
    "Bullous Disease Photos": {
        "display_name": "Bullous & Blistering Dermatoses",
        "risk_level": "Urgent",
        "description": "Autoimmune, infectious, or drug-induced disorder characterized by fluid-filled tense or flaccid blisters (bullae) in the epidermis or dermo-epidermal junction.",
        "tone_guidance": {
            "light": "Tense or flaccid blisters on an erythematous or normal-appearing base with marked raw erosion after rupture.",
            "medium": "Blistering with prominent post-bullous dusky hyperpigmented macules upon healing.",
            "dark": "Erythematous base may be masked by skin pigment; blisters may appear pale or cloudy against deep skin. Deep post-inflammatory pigmentation often persists for months."
        },
        "care_recommendations": [
            "DO NOT puncture or peel blister roofs; intact blister roofs provide a sterile biological dressing.",
            "Protect denuded/eroded skin areas with sterile petroleum jelly and non-adherent silicone dressings.",
            "Seek emergency medical evaluation for systemic assessment, immunofluorescence, and tailored therapy.",
            "Review all medications started within the last 8 weeks with your physician."
        ],
        "when_to_see_doctor": [
            "Immediate hospital or specialist evaluation is required for all new widespread blistering eruptions."
        ],
        "red_flags": [
            "Involvement of oral, ocular, genital, or nasal mucous membranes.",
            "Skin detachment resembling a scald (Nikolsky's sign — possible Stevens-Johnson Syndrome / TEN).",
            "High fever, shivering, or signs of systemic sepsis."
        ]
    },
    "Cellulitis Impetigo and other Bacterial Infections": {
        "display_name": "Bacterial Skin Infection (Cellulitis / Impetigo)",
        "risk_level": "Urgent",
        "description": "Acute bacterial infection of the dermis and subcutaneous tissue (Cellulitis) or superficial epidermis (Impetigo), most commonly caused by Streptococcus or Staphylococcus aureus.",
        "tone_guidance": {
            "light": "Presents with distinct, expanding bright red erythema, localized edema, and warmth that is readily visible.",
            "medium": "Erythema may be muted or maroon-toned. Rely on warmth, localized induration (firmness), and tender swelling rather than color alone.",
            "dark": "Erythema may be difficult to see and can present as hyperpigmented, violaceous, or darker skin. Palpate for unilateral warmth, induration, edema (peau d'orange texture), and tenderness."
        },
        "care_recommendations": [
            "Urgent physician evaluation is required to initiate oral or intravenous antibiotic therapy.",
            "Draw a pen border around the edge of the redness/swelling with the current time noted to monitor whether the infection is expanding.",
            "Elevate the affected limb to reduce dependent edema and relieve throbbing pain.",
            "Keep the area clean, dry, and protected with a sterile dressing. Avoid home lancing or squeezing."
        ],
        "when_to_see_doctor": [
            "Immediate same-day medical care is essential for any suspected bacterial skin infection."
        ],
        "red_flags": [
            "High fever, chills, confusion, or elevated heart rate.",
            "Red streaks radiating up the limb toward lymph nodes (lymphangitis).",
            "Rapid expansion of swelling or intense, out-of-proportion pain (possible necrotizing fasciitis)."
        ]
    },
    "Eczema Photos": {
        "display_name": "Eczematous Dermatitis",
        "risk_level": "Low",
        "description": "General term for a group of non-contagious inflammatory skin conditions characterized by dry, itchy, inflamed patches with microvesiculation and scaling.",
        "tone_guidance": {
            "light": "Typical presentation of pink to bright red dry plaques with visible scaling and excoriations.",
            "medium": "Dusky reddish-brown lesions with frequent post-inflammatory hyperpigmented halos.",
            "dark": "Erythema may appear gray-brown, purple, or dark chocolate. Prominent papular morphology and follicular eczema are common. Strong propensity for post-inflammatory dyschromia."
        },
        "care_recommendations": [
            "Moisturize frequently throughout the day with barrier-restoring ceramide creams.",
            "Avoid hot showers; use cool or tepid water with gentle fragrance-free cleansers.",
            "Identify and eliminate contact allergens such as nickel, fragrances, preservatives, or latex.",
            "Consider cool compresses or over-the-counter 1% hydrocortisone for short-term localized relief."
        ],
        "when_to_see_doctor": [
            "Symptoms fail to improve within 7–10 days of conservative home moisturizing.",
            "Plaques begin cracking painfully, oozing yellow fluid, or crusting.",
            "Itching severely impairs sleep or daily activities."
        ],
        "red_flags": [
            "Signs of secondary bacterial infection: expanding warmth, pus, or fever.",
            "Sudden emergence of painful grouped blisters with systemic malaise."
        ]
    },
    "Exanthems and Drug Eruptions": {
        "display_name": "Exanthematous & Drug-Induced Eruptions",
        "risk_level": "Moderate",
        "description": "Widespread symmetrical cutaneous rash, commonly triggered by viral infections or hypersensitivity to systemic medications (antibiotics, NSAIDs, anticonvulsants).",
        "tone_guidance": {
            "light": "Morbilliform (measles-like) eruption with widespread pink-to-red macules and papules that blanch upon pressure.",
            "medium": "Coalescing brownish-red maculopapular rash with prominent pruritus and post-inflammatory pigmentation.",
            "dark": "Lesions appear dark red, violaceous, or hyperpigmented. Blanching is harder to assess; look for symmetry, generalized spread, and epidermal sloughing."
        },
        "care_recommendations": [
            "Document all prescription and over-the-counter medications, supplements, and recent viral illnesses.",
            "Contact your prescribing physician immediately before stopping any essential prescription drug.",
            "Use soothing colloidal oatmeal baths and oral non-drowsy antihistamines to alleviate generalized itching.",
            "Avoid hot baths, friction, and harsh chemical topical agents."
        ],
        "when_to_see_doctor": [
            "Prompt evaluation is needed to confirm the causative agent and prevent severe progression."
        ],
        "red_flags": [
            "Mucosal involvement (blisters or ulcers inside mouth, eyes, genitals).",
            "Skin detachment, tenderness, or epidermal blistering.",
            "High fever, facial edema, shortness of breath, or swollen lymph nodes (possible DRESS syndrome)."
        ]
    },
    "Hair Loss Photos Alopecia and other Hair Diseases": {
        "display_name": "Alopecia & Scalp Disorders",
        "risk_level": "Low",
        "description": "Disorder of hair follicles resulting in localized or diffuse thinning, shedding, or complete loss of hair (e.g., Alopecia Areata, Androgenetic Alopecia, Telogen Effluvium).",
        "tone_guidance": {
            "light": "Scalp skin is typically pale; look for focal smooth patches or follicular erythema.",
            "medium": "Observe for follicular plugging, scaling, or perifollicular erythema.",
            "dark": "High incidence of Central Centrifugal Cicatricial Alopecia (CCCA) and Traction Alopecia. Early detection of follicular scarring is critical before irreversible follicle loss occurs."
        },
        "care_recommendations": [
            "Avoid high-tension hairstyles (tight braids, ponytails, dreadlocks, weaves) that pull on the scalp.",
            "Minimize high-heat tools and harsh chemical processing (relaxers, perms, bleaching).",
            "Use gentle, sulfate-free scalp shampoos and massage gently with fingertips rather than nails.",
            "Maintain a balanced diet rich in iron, zinc, vitamin D, and adequate protein."
        ],
        "when_to_see_doctor": [
            "Rapid or patchy hair shedding occurring over a few weeks.",
            "Scalp pain, burning, itching, or visible follicular pustules.",
            "Loss of eyebrows, eyelashes, or body hair."
        ],
        "red_flags": [
            "Visible scarring (shiny, poreless scalp skin) indicating potential cicatricial (scarring) alopecia.",
            "Rapid widespread total scalp shedding."
        ]
    },
    "Herpes HPV and other STDs Photos": {
        "display_name": "Herpetic / Viral / STI Cutaneous Lesions",
        "risk_level": "Moderate",
        "description": "Infectious dermatosis caused by viral pathogens such as Herpes Simplex Virus (HSV), Human Papillomavirus (HPV), or other sexually transmissible infections.",
        "tone_guidance": {
            "light": "Presents as grouped umbilicated vesicles on an erythematous base that erode into shallow ulcers.",
            "medium": "Grouped vesicles with early crusting and surrounding brownish-red inflammatory halo.",
            "dark": "Erythema may be muted; look for clustered pinpoint vesicles or shallow tender erosions with prominent post-inflammatory hyperpigmentation."
        },
        "care_recommendations": [
            "Consult a clinician promptly for diagnostic swab/PCR and early antiviral therapy (most effective within 72 hrs).",
            "Keep the affected area clean, dry, and protected. Avoid touching or picking lesions.",
            "Wash hands thoroughly after any contact with the lesion to prevent autoinoculation (especially to eyes).",
            "Refrain from intimate contact until lesions have completely re-epithelialized."
        ],
        "when_to_see_doctor": [
            "Confirmation and prescription of oral antiviral therapy (Acyclovir/Valacyclovir).",
            "Frequent recurrent outbreaks requiring suppressive therapy."
        ],
        "red_flags": [
            "Lesions near the eye, forehead, or tip of the nose (Hutchinson's sign — risk of corneal ulceration).",
            "Severe localized neurological pain (neuralgia) or facial nerve paralysis.",
            "Lesions in immunocompromised individuals."
        ]
    },
    "Light Diseases and Disorders of Pigmentation": {
        "display_name": "Photodermatoses & Pigmentary Disorders",
        "risk_level": "Low",
        "description": "Conditions involving dysregulated melanin production or photosensitivity reactions (e.g., Vitiligo, Melasma, Polymorphous Light Eruption).",
        "tone_guidance": {
            "light": "Hyperpigmentation presents as light brown to tan macules (e.g., solar lentigines). Vitiligo is most noticeable after summer UV exposure.",
            "medium": "Melasma and post-inflammatory hyperpigmentation are exceptionally common and can be long-lasting.",
            "dark": "Both depigmentation (Vitiligo) and hyperpigmentation (Melasma/PIH) present with high visual contrast and significant psychosocial impact. Strict photoprotection is essential."
        },
        "care_recommendations": [
            "Apply tinted broad-spectrum mineral sunscreen (SPF 50+ containing Iron Oxides) daily; iron oxides block visible blue light which triggers melasma in skin of color.",
            "Wear wide-brimmed hats and UV-blocking clothing during peak daylight hours (10 AM – 4 PM).",
            "Consider gentle, non-hydroquinone brightening actives (e.g., tranexamic acid, niacinamide, azelaic acid).",
            "Avoid aggressive laser treatments or harsh chemical peels without consulting an experienced dermatologist."
        ],
        "when_to_see_doctor": [
            "Rapidly spreading areas of pigment loss or new dark patches.",
            "Pigmented macules with irregular borders or color variegation.",
            "Rash that appears exclusively upon exposure to sunlight."
        ],
        "red_flags": [
            "Pigment changes accompanied by joint pain, oral ulcers, or malar rash (possible systemic lupus).",
            "A dark pigment spot that changes in size, shape, or color (rule out melanoma)."
        ]
    },
    "Lupus and other Connective Tissue diseases": {
        "display_name": "Lupus Cutaneous & Connective Tissue Manifestations",
        "risk_level": "Moderate",
        "description": "Autoimmune connective tissue condition presenting with photosensitive malar (butterfly) rash, discoid scarring plaques, or subacute annular cutaneous lupus.",
        "tone_guidance": {
            "light": "Classic pink-to-red malar erythema sparing the nasolabial folds, or erythematous annular scaly plaques.",
            "medium": "Dusky violet or brownish-red plaques with follicular hyperkeratosis and central atrophy.",
            "dark": "Discoid lupus is particularly prevalent and aggressive in Fitzpatrick IV–VI. Often causes marked hypopigmentation centrally surrounded by hyperpigmented borders, scarring, and permanent alopecia."
        },
        "care_recommendations": [
            "Schedule an appointment with a dermatologist or rheumatologist for serologic (ANA/anti-dsDNA) and histological evaluation.",
            "Rigorous daily sun avoidance and broad-spectrum mineral sunblock application are non-negotiable.",
            "Avoid tanning beds, fluorescent lighting without diffusers, and known photosensitizing medications.",
            "Document any systemic symptoms: joint swelling, chest pain on deep inspiration, fatigue, or mouth ulcers."
        ],
        "when_to_see_doctor": [
            "Any suspected lupus or autoimmune skin manifestation warrants professional diagnostic workup."
        ],
        "red_flags": [
            "Pleuritic chest pain, shortness of breath, or new leg edema.",
            "High fever without infectious source, or neurological symptoms (headaches, seizures).",
            "Progressive scarring skin lesions leading to tissue destruction."
        ]
    },
    "Melanoma Skin Cancer Nevi and Moles": {
        "display_name": "Melanoma & Melanocytic Lesions (Nevi / Moles)",
        "risk_level": "Urgent",
        "description": "Malignant neoplasm of melanocytes (Melanoma) or benign melanocytic nevi. Melanoma is the most serious form of skin cancer and requires immediate professional evaluation.",
        "tone_guidance": {
            "light": "High incidence on sun-exposed trunk and limbs. Look for the ABCDE criteria: Asymmetry, Border irregularity, Color variegation (black, brown, red, blue, white), Diameter >6mm, and Evolution.",
            "medium": "Check both sun-exposed skin and unexposed areas. Beware of 'ugly duckling' lesions that look distinctly different from the patient's other nevi.",
            "dark": "While overall incidence is lower, Acral Lentiginous Melanoma is the most common subtype in individuals of African, Asian, and Hispanic descent. Carefully inspect palms, soles of the feet, and nail beds (longitudinal melanonychia)."
        },
        "care_recommendations": [
            "DO NOT attempt to treat, scratch, freeze, or chemically remove any mole or pigment spot at home.",
            "Schedule an urgent in-person full-body dermatological examination with dermoscopy.",
            "Perform regular monthly skin self-examinations using a full-length mirror and good lighting.",
            "Protect all skin from UV radiation with broad-spectrum SPF 50+ sunscreen and protective clothing."
        ],
        "when_to_see_doctor": [
            "IMMEDIATE dermatology referral is required for any lesion exhibiting any of the ABCDE criteria."
        ],
        "red_flags": [
            "A mole that has recently grown, darkened, or changed shape.",
            "A spot that bleeds, oozes, itches persistently, or becomes tender.",
            "A new dark brown or black stripe appearing beneath a fingernail or toenail.",
            "A dark lesion on the palm, sole, or mucous membrane."
        ]
    },
    "Nail Fungus and other Nail Disease": {
        "display_name": "Onychomycosis & Nail Apparatus Disorders",
        "risk_level": "Low",
        "description": "Fungal infection (Onychomycosis) or non-infectious dystrophy (Psoriasis, Lichen Planus) affecting the nail plate, bed, and matrix.",
        "tone_guidance": {
            "light": "Yellow to brown subungual hyperkeratosis, onycholysis (nail plate detachment), and brittleness.",
            "medium": "Subungual debris with marked discoloration and periungual inflammation.",
            "dark": "Melanonychia (pigmented streaks) can be benign racial variant or fungal melanonychia, but must be differentiated from subungual melanoma (Hutchinson's sign)."
        },
        "care_recommendations": [
            "Keep nails trimmed short, clean, and filed straight across.",
            "Wear moisture-wicking socks and alternate shoes daily to allow footwear to dry thoroughly.",
            "Disinfect nail clippers and tools after each use; do not share nail instruments.",
            "Wear protective flip-flops in gym locker rooms, public pools, and shared showers."
        ],
        "when_to_see_doctor": [
            "Discoloration and thickening involve multiple nails or cause pain while walking.",
            "Over-the-counter topical lacquers show no progress after 3–6 months.",
            "Patients with diabetes or peripheral vascular disease require professional podiatric or dermatological care."
        ],
        "red_flags": [
            "Spreading redness, warmth, throbbing pain, or pus around the nail fold (acute paronychia).",
            "Single dark band on a single nail that is widening or spreading onto the cuticle (Hutchinson's sign)."
        ]
    },
    "Poison Ivy Photos and other Contact Dermatitis": {
        "display_name": "Contact Dermatitis (Allergic / Irritant / Toxicodendron)",
        "risk_level": "Low",
        "description": "Acute inflammatory cutaneous reaction caused by direct contact with an external allergen (e.g., urushiol in Poison Ivy/Oak, nickel, cosmetics) or chemical irritant.",
        "tone_guidance": {
            "light": "Prominent linear or streaked bright red erythematous plaques topped with tense microvesicles matching the pattern of plant brush.",
            "medium": "Dusky red or brownish plaques with intense pruritus and subsequent post-inflammatory darkening.",
            "dark": "Erythema is often obscured. Look for distinct linear streaks of grouped papules/vesicles with epidermal edema, warmth, and intense itching."
        },
        "care_recommendations": [
            "Wash all skin, clothing, pets, and tools that may have contacted urushiol plant resin with degreasing soap immediately.",
            "Apply cool compresses, calamine lotion, or colloidal oatmeal soaks for 15–20 minutes to relieve itching.",
            "Over-the-counter 1% hydrocortisone cream may be applied to mild, non-facial, non-genital areas for up to 7 days.",
            "Take oral antihistamines to reduce the urge to scratch and avoid secondary bacterial infection."
        ],
        "when_to_see_doctor": [
            "The rash covers more than 20–25% of your body surface.",
            "Severe facial or eyelid swelling that impedes vision.",
            "Rash fails to improve after 10–14 days of conservative management."
        ],
        "red_flags": [
            "Involvement of the eyes, mouth, or genitalia.",
            "Difficulty breathing or swallowing (possible systemic anaphylaxis or inhalation of burning poison ivy).",
            "Signs of secondary bacterial infection: yellow crusting, pus, or fever."
        ]
    },
    "Psoriasis pictures Lichen Planus and related diseases": {
        "display_name": "Psoriasis & Papulosquamous Disorders",
        "risk_level": "Moderate",
        "description": "Chronic immune-mediated dermatosis characterized by accelerated epidermal turnover resulting in well-demarcated plaques, silver scaling, or violaceous polygonal papules (Lichen Planus).",
        "tone_guidance": {
            "light": "Classic presentation: sharply demarcated bright salmon-pink to red plaques covered with thick, silvery-white micaceous scales (Auspitz sign upon removal).",
            "medium": "Plaques appear reddish-brown or purple-pink with prominent silvery or grayish scales.",
            "dark": "Plaques are typically violaceous, dark brown, or slate-gray with grayish scales rather than red/silvery. High frequency of significant post-inflammatory hypopigmentation or hyperpigmentation upon lesion resolution."
        },
        "care_recommendations": [
            "Apply generous moisturizers and keratolytics (urea, salicylic acid) to soften and gently descale plaques.",
            "Avoid physical trauma, friction, or aggressive scratching (Koebner phenomenon triggers new plaques).",
            "Engage in moderate, controlled natural sunlight exposure (10–15 mins) if recommended by your physician.",
            "Consult a dermatologist for topical prescription therapies (corticosteroids, vitamin D analogues) or systemic biologics."
        ],
        "when_to_see_doctor": [
            "Plaques are widespread, painful, or cracking and bleeding.",
            "Joint pain, stiffness, or swelling in fingers/toes or lower back (suggesting Psoriatic Arthritis).",
            "Nail pitting, crumbling, or oil drop discoloration."
        ],
        "red_flags": [
            "Pustular psoriasis: sudden outbreak of widespread sterile pustules with high fever.",
            "Erythrodermic psoriasis: generalized bright redness and shedding affecting nearly the entire skin surface."
        ]
    },
    "Scabies Lyme Disease and other Infestations and Bites": {
        "display_name": "Parasitic Infestations, Arthropod Bites & Lyme Disease",
        "risk_level": "Moderate",
        "description": "Infectious or parasitic dermatosis resulting from mite infestation (Sarcoptes scabiei), tick-borne bacterial infection (Lyme Disease / Borrelia), or arthropod bites.",
        "tone_guidance": {
            "light": "Scabies presents with thread-like erythematous burrows in finger webs, wrists, and beltlines. Lyme disease presents with an expanding target-like 'bullseye' rash (Erythema Migrans).",
            "medium": "Excoriated pruritic papules and nodules in axillae and groin. Lyme rash appears as a dusky erythematous expanding circular ring.",
            "dark": "Classic burrows are harder to detect visually; look for intensely pruritic nodular lesions in genital/axillary regions. Erythema migrans (Lyme) may present as an expanding dark brown or violaceous patch."
        },
        "care_recommendations": [
            "Medical evaluation is required for prescription anti-parasitic treatment (e.g., 5% Permethrin cream or oral Ivermectin).",
            "Wash all bedding, towels, and clothing worn in the past 4 days in hot water (>60°C/140°F) and machine dry on high heat.",
            "All household members and close physical contacts must be treated simultaneously to prevent re-infestation.",
            "For suspected tick bites, take clear photos and seek prompt medical attention for prophylactic doxycycline."
        ],
        "when_to_see_doctor": [
            "Intense itching that worsens markedly at night.",
            "Presence of an expanding circular ring following an outdoor tick exposure.",
            "Multiple household members developing similar pruritic rashes."
        ],
        "red_flags": [
            "High fever, stiff neck, joint pain, facial droop (Bell's palsy), or palpitations following a tick bite (disseminated Lyme).",
            "Secondary bacterial infection with intense pain and purulent drainage."
        ]
    },
    "Seborrheic Keratoses and other Benign Tumors": {
        "display_name": "Seborrheic Keratoses & Benign Cutaneous Tumors",
        "risk_level": "Low",
        "description": "Common, entirely benign non-cancerous epidermal proliferation characterized by 'stuck-on', waxy, verrucous, or pigmented papules and plaques.",
        "tone_guidance": {
            "light": "Tan, light brown, or yellow-brown waxy, stuck-on plaques with distinct follicular pseudocysts (keratin pearls).",
            "medium": "Presents as dark brown to black waxy plaques, sometimes mimicking melanoma to the untrained eye.",
            "dark": "Extremely common in individuals of African and Asian descent as Dermatosis Papulosa Nigra (DPN) — small, smooth, hyperpigmented black/brown papules primarily on cheeks and neck."
        },
        "care_recommendations": [
            "Seborrheic keratoses are harmless and do not require treatment unless irritated, caught on clothing, or cosmetically concerning.",
            "DO NOT pick, scratch, or try to scrape off these lesions, which causes bleeding and secondary infection.",
            "If removal is desired, consult a dermatologist for cryotherapy, curettage, or electrosurgery.",
            "Continue regular skin checks to ensure any new or evolving pigmented spot is professionally evaluated."
        ],
        "when_to_see_doctor": [
            "A lesion becomes constantly inflamed, bleeds, or gets caught on jewelry or garments.",
            "You are uncertain whether the spot is benign or a dysplastic nevus / melanoma."
        ],
        "red_flags": [
            "Sudden explosive eruption of hundreds of new seborrheic keratoses over a few weeks (Sign of Leser-Trélat — warrants systemic medical review).",
            "A dark lesion with irregular, notched borders or color variegation."
        ]
    },
    "Systemic Disease": {
        "display_name": "Cutaneous Manifestations of Systemic Disease",
        "risk_level": "Moderate",
        "description": "Skin signs reflecting underlying internal medical conditions, such as endocrine disorders (diabetes, thyroid), hepatic/renal failure, or nutritional deficiencies.",
        "tone_guidance": {
            "light": "Erythematous or yellowish papules (xanthomas), pretibial myxedema, or cutaneous manifestations of metabolic disease.",
            "medium": "Acanthosis nigricans presenting as velvety hyperpigmented plaques in axillary, neck, and flexural folds.",
            "dark": "Acanthosis nigricans is highly prevalent and visible as thickened, velvety dark plaques. Also look for generalized pruritus without primary rash (renal/cholestatic pruritus)."
        },
        "care_recommendations": [
            "Schedule a comprehensive medical examination including blood glucose, HbA1c, thyroid panel, and liver/kidney function tests.",
            "Maintain meticulous skin hydration with fragrance-free urea or lactic acid moisturizers.",
            "Adopt lifestyle modifications: balanced nutrition, regular exercise, and glycemic control.",
            "Avoid scratching dry, pruritic areas to prevent secondary bacterial infection."
        ],
        "when_to_see_doctor": [
            "Unexplained progressive skin changes, velvety skin thickening, or persistent generalized itching without rash."
        ],
        "red_flags": [
            "Sudden emergence of yellow-orange nodular eruptions across elbows, knees, or buttocks (eruptive xanthomas — severe hypertriglyceridemia).",
            "Jaundice (yellowing of skin and eyes) or palmar erythema."
        ]
    },
    "Tinea Ringworm Candidiasis and other Fungal Infections": {
        "display_name": "Superficial Fungal Infection (Tinea / Candidiasis)",
        "risk_level": "Low",
        "description": "Superficial cutaneous mycosis caused by dermatophyte fungi (Tinea Corporis/Pedis/Cruris) or yeast (Candida) affecting keratinized tissue or intertriginous skin folds.",
        "tone_guidance": {
            "light": "Classic ring-like lesion with an elevated, erythematous, scaly active leading edge and central clearing ('ringworm').",
            "medium": "Annular lesion with a dusky erythematous border, fine collarette of scale, and post-inflammatory pigmentation.",
            "dark": "Erythema may be subtle or absent. The active expanding scaly border appears darker brown or hyperpigmented with central clearing or hyperpigmentation. Often misdiagnosed as eczema; applying topical steroids can worsen the infection (Tinea Incognito)."
        },
        "care_recommendations": [
            "Apply over-the-counter topical antifungal cream (e.g., Terbinafine, Clotrimazole, Ketoconazole) covering the lesion PLUS a 2-cm margin around it.",
            "Continue applying the antifungal for at least 1–2 weeks AFTER visible clearing to prevent recurrence.",
            "DO NOT apply topical steroid creams (hydrocortisone), which temporarily reduces itching but causes the fungus to multiply aggressively (Tinea Incognito).",
            "Keep the affected body areas clean and dry; do not share towels, sports gear, or clothing."
        ],
        "when_to_see_doctor": [
            "Infection involves the scalp (Tinea Capitis), which requires oral antifungal medication.",
            "No improvement after 2 weeks of compliant topical antifungal therapy.",
            "Widespread or rapidly spreading infection."
        ],
        "red_flags": [
            "Intense warmth, swelling, red streaking, or purulent exudate indicating secondary bacterial infection.",
            "Deep painful kerion (boggy inflammatory mass) on the scalp."
        ]
    },
    "Urticaria Hives": {
        "display_name": "Urticaria (Hives / Wheals)",
        "risk_level": "Low",
        "description": "Vascular reaction of the upper dermis characterized by transient, intensely pruritic, erythematous edematous plaques (wheals) that resolve individually within 24 hours.",
        "tone_guidance": {
            "light": "Blanchable bright pink or red edematous raised plaques, often with pale center.",
            "medium": "Raised wheals with dusky pink or reddish border, highly transient.",
            "dark": "Erythema may not be visible. Wheals present as raised, palpable, smooth edematous swellings that feel warm and intensely itchy. Post-inflammatory pigmentation can follow persistent episodes."
        },
        "care_recommendations": [
            "Take a non-drowsy second-generation oral antihistamine (e.g., Cetirizine, Fexofenadine, Loratadine).",
            "Apply cool compresses or take a cool colloidal oatmeal bath to soothe intense itching.",
            "Wear loose, smooth cotton clothing; avoid tight waistbands or abrasive fabrics.",
            "Avoid known triggers such as NSAIDs, sudden temperature extremes, stress, and alcohol."
        ],
        "when_to_see_doctor": [
            "Hives persist daily for longer than 6 weeks (Chronic Spontaneous Urticaria).",
            "Individual wheals stay in the exact same spot for longer than 24–48 hours or leave bruises upon resolving (rule out urticarial vasculitis)."
        ],
        "red_flags": [
            "Swelling of the lips, tongue, throat, or uvula (angioedema).",
            "Difficulty breathing, wheezing, dizziness, or lightheadedness (Anaphylaxis — call 911 / emergency services immediately)."
        ]
    },
    "Vascular Tumors": {
        "display_name": "Vascular Tumors & Malformations",
        "risk_level": "Moderate",
        "description": "Benign or malignant proliferation of endothelial cells and blood vessels (e.g., Cherry Angioma, Infantile Hemangioma, Pyogenic Granuloma, Kaposi Sarcoma).",
        "tone_guidance": {
            "light": "Bright cherry-red, purple, or ruby vascular papules. Compressible and blanchable when non-thrombosed.",
            "medium": "Deep purple or dark red vascular lesions.",
            "dark": "Often present as dark purple, brown, or black nodular lesions. Must be carefully distinguished from pigmented melanoma."
        },
        "care_recommendations": [
            "Consult a physician or dermatologist for accurate diagnosis and exclusion of malignancy.",
            "Avoid scratching or bumping vascular lesions, which can bleed profusely.",
            "If bleeding occurs, apply firm, continuous direct pressure with a clean gauze for 10–15 minutes.",
            "Do not attempt home lancing, burning, or chemical destruction."
        ],
        "when_to_see_doctor": [
            "Rapidly growing vascular nodule that bleeds easily with minimal friction (e.g., Pyogenic Granuloma).",
            "Multiple new violaceous plaques or nodules appearing over a short timeframe."
        ],
        "red_flags": [
            "Uncontrollable bleeding despite continuous direct pressure.",
            "Rapidly spreading violaceous or dark purple plaques in immunocompromised patients."
        ]
    },
    "Vasculitis Photos": {
        "display_name": "Cutaneous Vasculitis",
        "risk_level": "Urgent",
        "description": "Inflammation and necrosis of cutaneous blood vessel walls resulting in non-blanching palpable purpura, hemorrhagic bullae, or necrotic ulcers.",
        "tone_guidance": {
            "light": "Classic palpable purpura: pinpoint to coalescing non-blanching violaceous or dark purple papules primarily on lower extremities.",
            "medium": "Deep purple, dark brown, or black palpable papules and retiform purpura.",
            "dark": "Purpura appears as dark brown, slate-black, or violaceous non-blanching spots. Palpation for elevation (palpable purpura) and tenderness is crucial, as color change may be subtle against dark melanin."
        },
        "care_recommendations": [
            "Immediate medical evaluation by a dermatologist, rheumatologist, or internist is required.",
            "Avoid prolonged standing or walking; keep legs elevated to decrease venous hydrostatic pressure.",
            "Document any systemic symptoms: fever, joint pain, abdominal pain, or blood in urine/stool.",
            "Avoid strenuous exercise until a full medical assessment is complete."
        ],
        "when_to_see_doctor": [
            "Every patient with suspected palpable purpura requires immediate professional diagnostic evaluation."
        ],
        "red_flags": [
            "Blood in urine (hematuria) or dark tea-colored urine indicating renal involvement.",
            "Severe abdominal pain, gastrointestinal bleeding, or joint swelling.",
            "Rapidly expanding necrotic skin ulcers with intense pain."
        ]
    },
    "Warts Molluscum and other Viral Infections": {
        "display_name": "Viral Infections (Verruca Warts & Molluscum)",
        "risk_level": "Low",
        "description": "Benign viral epidermal infection caused by Human Papillomavirus (common warts) or Poxvirus (Molluscum Contagiosum), characterized by hyperkeratotic papules or umbilicated pearly lesions.",
        "tone_guidance": {
            "light": "Verrucous hyperkeratotic papules with tiny black thrombosed capillary dots (common warts) or dome-shaped pearly papules with central umbilication (molluscum).",
            "medium": "Presents as firm, flesh-colored or brownish papules, frequently leaving post-inflammatory hyperpigmented spots after resolution.",
            "dark": "Lesions may be hypopigmented or hyperpigmented relative to surrounding skin. Avoid scratching or picking to prevent autoinoculation (spreading along scratch lines — Koebner phenomenon) and keloids."
        },
        "care_recommendations": [
            "Do not pick, scratch, bite, or shave over warts to prevent viral spreading to other body sites.",
            "Keep hands clean and dry; do not share towels or personal grooming items.",
            "Over-the-counter salicylic acid preparations may be used for common warts on feet and hands (avoid on face and genitals).",
            "Cover lesions with a small bandage if participating in contact sports or swimming."
        ],
        "when_to_see_doctor": [
            "Warts are located on the face, genitals, or near mucous membranes.",
            "Lesions are painful, rapidly multiplying, or interfering with daily activities.",
            "Over-the-counter therapies have failed after 2–3 months of consistent use."
        ],
        "red_flags": [
            "Signs of secondary bacterial infection: expanding redness, swelling, pus, or warmth.",
            "Lesions in immunocompromised individuals showing atypical explosive spread."
        ]
    }
}

DEFAULT_FALLBACK_DISEASE = "Eczema Photos"


def get_tone_category(skin_tone: Optional[int]) -> str:
    """Map Fitzpatrick scale 1-6 to knowledge base categories"""
    if skin_tone in [1, 2]:
        return "light"
    elif skin_tone in [3, 4]:
        return "medium"
    elif skin_tone in [5, 6]:
        return "dark"
    return "medium"


def generate_knowledge_engine_analysis(
    disease: str,
    confidence: float,
    top_3: List[Dict[str, Any]],
    skin_tone: Optional[int],
    symptoms: List[str],
    additional_info: Optional[str]
) -> Dict[str, Any]:
    """
    Deterministic, clinically rigorous medical explanation engine.
    Always reliable, factors in exact skin tone and reported symptoms.
    """
    kb_entry = DISEASE_KNOWLEDGE_BASE.get(disease, DISEASE_KNOWLEDGE_BASE[DEFAULT_FALLBACK_DISEASE])
    tone_cat = get_tone_category(skin_tone)
    tone_insight = kb_entry["tone_guidance"].get(tone_cat, kb_entry["tone_guidance"]["medium"])

    # Symptom correlation analysis
    symptom_notes = []
    if symptoms:
        symptom_str = ", ".join(symptoms)
        symptom_notes.append(f"Reported symptoms ({symptom_str}) were factored into the clinical profile.")
        
        # Specific correlations
        has_itching = any("itch" in s.lower() for s in symptoms)
        has_pain = any("pain" in s.lower() or "tender" in s.lower() for s in symptoms)
        has_bleeding = any("bleed" in s.lower() or "ooz" in s.lower() for s in symptoms)
        has_blister = any("blister" in s.lower() for s in symptoms)

        if has_itching and kb_entry["risk_level"] != "Urgent":
            symptom_notes.append("Active pruritus correlates with epidermal barrier inflammation and mast cell histamine release.")
        if has_pain:
            symptom_notes.append("Localized pain indicates possible dermal or deep tissue involvement, suggesting heightened clinical vigilance.")
        if has_bleeding:
            symptom_notes.append("Bleeding or oozing indicates compromised epidermal integrity or ulceration; gentle handling and professional evaluation are recommended.")
        if has_blister:
            symptom_notes.append("Presence of blistering warrants protection against friction and exclusion of bullous or viral etiologies.")
    else:
        symptom_notes.append("No specific subjective symptoms were selected; evaluation is based primarily on visual cutaneous presentation.")

    if additional_info and additional_info.strip():
        symptom_notes.append(f"Patient note noted: '{additional_info.strip()}'.")

    # Risk level adjustment if urgent symptoms detected
    risk_level = kb_entry["risk_level"]
    if any("bleed" in s.lower() for s in symptoms) and risk_level == "Moderate":
        risk_level = "Urgent"

    return {
        "display_name": kb_entry["display_name"],
        "risk_level": risk_level,
        "description": kb_entry["description"],
        "skin_tone_insights": tone_insight,
        "symptom_analysis": " ".join(symptom_notes),
        "care_recommendations": kb_entry["care_recommendations"],
        "when_to_see_doctor": kb_entry["when_to_see_doctor"],
        "red_flags": kb_entry["red_flags"],
        "ai_generated": False,
        "ai_provider": "SkinANS Clinical Knowledge Engine"
    }


def call_gemini_multimodal(
    disease: str,
    confidence: float,
    top_3: List[Dict[str, Any]],
    skin_tone: Optional[int],
    symptoms: List[str],
    additional_info: Optional[str],
    api_key: str
) -> Optional[Dict[str, Any]]:
    """
    Calls Google GenAI Gemini 3.8 Flash to synthesize multi-modal clinical explanation.
    Returns structured dict if successful, None otherwise.
    """
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)

        prompt = f"""
You are an expert dermatological AI clinical consultant for the SkinANS AI platform.
Analyze the following patient case and synthesize an objective, structured, and clinically sound summary.

Patient Case Details:
- Suspected Model Diagnosis: {disease} (Confidence: {confidence}%)
- Differential Diagnoses: {json.dumps(top_3)}
- Patient Fitzpatrick Skin Tone: Type {skin_tone if skin_tone else 'Not Specified'} (Scale 1 to 6)
- Reported Symptoms: {', '.join(symptoms) if symptoms else 'None reported'}
- Additional Patient Notes: {additional_info if additional_info else 'None'}

You MUST respond strictly in valid JSON format with the following keys:
{{
  "display_name": "Clear medical and common name of the condition",
  "risk_level": "Low" | "Moderate" | "Urgent",
  "description": "2-3 sentences explaining what this condition is in accessible yet medically sound terms",
  "skin_tone_insights": "Detailed explanation of how this specific condition manifests on Fitzpatrick Tone {skin_tone} (e.g. erythema color, hyperpigmentation risk, dyschromia)",
  "symptom_analysis": "Clinical correlation between the patient's reported symptoms and this condition",
  "care_recommendations": ["Actionable supportive tip 1", "Tip 2", "Tip 3", "Tip 4"],
  "when_to_see_doctor": ["Specific scenario 1", "Scenario 2", "Scenario 3"],
  "red_flags": ["Critical warning sign 1", "Critical warning sign 2"]
}}
"""

        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )

        if response and response.text:
            parsed = json.loads(response.text)
            parsed["ai_generated"] = True
            parsed["ai_provider"] = "Gemini 3.8 Flash (Multi-Modal AI)"
            return parsed
    except Exception as e:
        logger.warning(f"Gemini multi-modal call encountered an error: {e}. Falling back to Clinical Knowledge Engine.")
        return None


def generate_clinical_analysis(
    disease: str,
    confidence: float,
    top_3: List[Dict[str, Any]],
    skin_tone: Optional[int] = None,
    symptoms: Optional[List[str]] = None,
    additional_info: Optional[str] = None
) -> Dict[str, Any]:
    """
    Primary entry point: Attempts Gemini multi-modal synthesis if configured and valid,
    with seamless fallback to the deterministic Clinical Knowledge Engine.
    """
    symptoms_list = symptoms or []
    gemini_key = os.getenv("GEMINI_API_KEY")

    if gemini_key and len(gemini_key.strip()) > 10:
        gemini_result = call_gemini_multimodal(
            disease=disease,
            confidence=confidence,
            top_3=top_3,
            skin_tone=skin_tone,
            symptoms=symptoms_list,
            additional_info=additional_info,
            api_key=gemini_key.strip()
        )
        if gemini_result:
            return gemini_result

    # Fallback to local clinical engine
    return generate_knowledge_engine_analysis(
        disease=disease,
        confidence=confidence,
        top_3=top_3,
        skin_tone=skin_tone,
        symptoms=symptoms_list,
        additional_info=additional_info
    )
