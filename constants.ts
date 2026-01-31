import { SchemaDef } from './types';

export const MEDICAL_SCHEMA: SchemaDef = {
  "global_instructions": {
    "general": "Proceed as indicated in the general instructions. You will be given a PDF document. You must study this document thoroughly and make sure you understand it 100%. For each block and section, answer the questions that are specified in this prompt. Do not invent any data; all information must come from the PDF that is provided. This is mandatory.",
    "extraction": "From the contents of the PDF you must extract the information needed to answer each question indicated below, in each of the blocks and sections described. You must answer only what is being asked."
  },
  "blocks": [
    {
      "block_number": 1,
      "block_name": "Info",
      "description": "This block is called “Info” and is composed of 3 sections.",
      "sections": [
        {
          "section_name": "ID",
          "question": "ID",
          "instructions": "You must always leave this field blank.",
          "expected_answer_type": "blank"
        },
        {
          "section_name": "Extractor",
          "question": "Extractor",
          "instructions": "The answer must always be: “MJA”.",
          "expected_answer_type": "fixed_string",
          "fixed_value": "MJA"
        },
        {
          "section_name": "Subject",
          "question": "Subject",
          "instructions": "Indicate here whether the PDF is about a whole-cell vaccine, an acellular vaccine, or both.",
          "expected_answer_type": "one_of",
          "allowed_values_examples": [
            "whole-cell",
            "acellular",
            "both"
          ]
        }
      ]
    },
    {
      "block_number": 2,
      "block_name": "General",
      "description": "Block 2 is called “General”.",
      "sections": [
        {
          "section_name": "Description of Serology simple timing",
          "question": "Description of Serology simple timing (pre, post 3-dose primary series, pre-booster, post-booster, etc)",
          "instructions": "Answer describing how serology timing is structured in the study (e.g., pre-vaccination, 1 month after 3rd dose, pre-booster, post-booster, etc.).",
          "expected_answer_type": "free_text"
        }
      ]
    },
    {
      "block_number": 3,
      "block_name": "Pre-Administration",
      "description": "Block 3 is called “Pre-Administration” and is composed of 3 sections.",
      "sections": [
        {
          "section_name": "Pre-vaccine serology measured (yes/no)",
          "question": "Where serology samples measured before any pertussis vaccine was administered?",
          "instructions": "Answer only with: \"yes\", \"no\", or \"Not specified\".",
          "expected_answer_type": "one_of",
          "allowed_values": [
            "yes",
            "no",
            "Not specified"
          ]
        },
        {
          "section_name": "Timing of pre-vaccine serology (categorical)",
          "question": "When were serology samples measured before any pertussis vaccine was administered?",
          "instructions": "Study the PDF and choose which of the following options is correct, then report it exactly: \"on the day of the immunization\", \">6 weeks before vaccination\", \"4-6 weeks before vaccination\", \"Serologies were not measured before vaccination\", \"Not described\" or \"Other\".",
          "expected_answer_type": "one_of",
          "allowed_values": [
            "on the day of the immunization",
            ">6 weeks before vaccination",
            "4-6 weeks before vaccination",
            "Serologies were not measured before vaccination",
            "Not described",
            "Other"
          ]
        },
        {
          "section_name": "Description of pre-vaccine sample timing",
          "question": "Describe Sample timing before any pertussis vaccine was administered",
          "instructions": "Describe in free text, based strictly on the PDF, when samples were taken before any pertussis vaccine was administered.",
          "expected_answer_type": "free_text"
        }
      ]
    },
    {
      "block_number": 4,
      "block_name": "Serologies After Primary Series",
      "description": "Block 4 is called “Serologies After Primary Series” and is composed of 8 sections.",
      "sections": [
        {
          "section_name": "Serology 1 month after 3rd dose (yes/no)",
          "question": "Were serologies for pertussis antigens measured 1 month after the 3rd dose, if primary series were assesed?",
          "instructions": "Choose the best answer and respond only with one of: \"yes\", \"no\", \"This study does not assess primary series\", \"not specified\".",
          "expected_answer_type": "one_of",
          "allowed_values": [
            "yes",
            "no",
            "This study does not assess primary series",
            "not specified"
          ]
        },
        {
          "section_name": "Timing description 1 month after 3rd dose",
          "question": "When were serologies for pertussis antigens measured 1 month after the 3rd dose, if primary series were assesed?",
          "instructions": "Describe in free text the timing, strictly based on what the PDF states.",
          "expected_answer_type": "free_text"
        },
        {
          "section_name": "Serology 6 months after 3rd dose (yes/no)",
          "question": "Were serologies for pertussis antigens measured after 6 months after 3rd dose, if primary series were assesed?",
          "instructions": "Choose the best answer and respond only with one of: \"yes\", \"no\", \"This study does not assess primary series\", \"not specified\".",
          "expected_answer_type": "one_of",
          "allowed_values": [
            "yes",
            "no",
            "This study does not assess primary series",
            "not specified"
          ]
        },
        {
          "section_name": "Timing description 6 months after 3rd dose",
          "question": "When were serologies for pertussis antigens measured after 6 months after 3rd dose, if primary series were assesed?",
          "instructions": "Describe in free text the timing, strictly based on what the PDF states.",
          "expected_answer_type": "free_text"
        },
        {
          "section_name": "Serology at 12 months of age after 3rd dose (yes/no)",
          "question": "Were serologies for pertussis antigens measured at 12 months of age after 3rd dose, if primary series were assesed?",
          "instructions": "Choose the best answer and respond only with one of: \"yes\", \"no\", \"This study does not assess primary series\", \"not specified\".",
          "expected_answer_type": "one_of",
          "allowed_values": [
            "yes",
            "no",
            "This study does not assess primary series",
            "not specified"
          ]
        },
        {
          "section_name": "Timing description at 12 months of age after 3rd dose",
          "question": "When were serologies for pertussis antigens measured at 12 months of age after 3rd dose, if primary series were assesed?",
          "instructions": "Describe in free text the timing, strictly based on what the PDF states.",
          "expected_answer_type": "free_text"
        },
        {
          "section_name": "Serology at any other moment after 3rd dose (yes/no)",
          "question": "Were serologies for pertussis antigens measured at any other moment after 3rd dose, if primary series were assesed?",
          "instructions": "Choose the best answer and respond only with one of: \"yes\", \"no\", \"This study does not assess primary series\", \"not specified\".",
          "expected_answer_type": "one_of",
          "allowed_values": [
            "yes",
            "no",
            "This study does not assess primary series",
            "not specified"
          ]
        },
        {
          "section_name": "Timing description other moments after 3rd dose",
          "question": "If measured at other moment, describe when",
          "instructions": "Describe in free text any other moments after the 3rd dose when serologies were measured, based strictly on the PDF.",
          "expected_answer_type": "free_text"
        }
      ]
    },
    {
      "block_number": 5,
      "block_name": "Before Booster Dose",
      "description": "Block 5 is called “Before Booster Dose” and is composed of 3 sections.",
      "sections": [
        {
          "section_name": "Serology immediately pre-booster (yes/no)",
          "question": "Were serologies for pertussis antigens measured immediately pre-booster (day 0), if booster was assesed?",
          "instructions": "Choose the best answer and respond only with one of: \"yes\", \"no\" or \"not described\".",
          "expected_answer_type": "one_of",
          "allowed_values": [
            "yes",
            "no",
            "not described"
          ]
        },
        {
          "section_name": "Serology any other moment pre-booster (yes/no)",
          "question": "Were serologies for pertussis antigens measured at any other moment pre-booster (day 0), if booster was assesed?",
          "instructions": "Choose the best answer and respond only with one of: \"yes\", \"no\" or \"not described\".",
          "expected_answer_type": "one_of",
          "allowed_values": [
            "yes",
            "no",
            "not described"
          ]
        },
        {
          "section_name": "Timing description any other moment pre-booster",
          "question": "When were serologies for pertussis antigens measured at any other moment pre-booster (day 0), if booster was assesed?",
          "instructions": "Describe in free text the timing, strictly based on what the PDF states.",
          "expected_answer_type": "free_text"
        }
      ]
    },
    {
      "block_number": 6,
      "block_name": "After Booster Dose",
      "description": "Block 6 is called “After Booster Dose” and is composed of 4 sections.",
      "sections": [
        {
          "section_name": "Serology 1 month post-booster (yes/no)",
          "question": "Were serologies for pertussis antigens measured after 1 month post-booster, if booster was assesed?",
          "instructions": "Choose the best answer and respond only with one of: \"yes\", \"no\", \"This study does not assess booster doses\", \"not specified\".",
          "expected_answer_type": "one_of",
          "allowed_values": [
            "yes",
            "no",
            "This study does not assess booster doses",
            "not specified"
          ]
        },
        {
          "section_name": "Serology 6–12 months post-booster (yes/no)",
          "question": "Were serologies for pertussis antigens measured after 6–12 months post-booster, if booster was assesed?",
          "instructions": "Choose the best answer and respond only with one of: \"yes\", \"no\", \"This study does not assess booster doses\", \"not specified\".",
          "expected_answer_type": "one_of",
          "allowed_values": [
            "yes",
            "no",
            "This study does not assess booster doses",
            "not specified"
          ]
        },
        {
          "section_name": "Serology some other time post-booster (yes/no)",
          "question": "Were serologies for pertussis antigens measured some other time after post-booster, if booster was assesed?",
          "instructions": "Choose the best answer and respond only with one of: \"yes\", \"no\", \"This study does not assess booster doses\", \"not specified\".",
          "expected_answer_type": "one_of",
          "allowed_values": [
            "yes",
            "no",
            "This study does not assess booster doses",
            "not specified"
          ]
        },
        {
          "section_name": "Timing description other times post-booster",
          "question": "When were serologies for pertussis antigens measured after post-booster, if booster was assesed?",
          "instructions": "Describe in free text the timing, strictly based on what the PDF states.",
          "expected_answer_type": "free_text"
        }
      ]
    },
    {
      "block_number": 7,
      "block_name": "Long-Term Follow-Up",
      "description": "Block 7 is called “Long-Term Follow-Up” and is composed of 2 sections.",
      "sections": [
        {
          "section_name": "Serology 2–5 years post-booster (yes/no)",
          "question": "Were serologies for pertussis antigens measured 2–5 years post-booster, if booster was assesed?",
          "instructions": "Choose the best answer and respond only with one of: \"yes\", \"no\", \"not described\".",
          "expected_answer_type": "one_of",
          "allowed_values": [
            "yes",
            "no",
            "not described"
          ]
        },
        {
          "section_name": "Timing description last long-term assessment",
          "question": "If they were measured long term post-booster, when was the last time they were assesed?",
          "instructions": "Describe in free text when the last long-term post-booster serology assessment was done, strictly based on the PDF.",
          "expected_answer_type": "free_text"
        }
      ]
    },
    {
      "block_number": 8,
      "block_name": "8. Laboratory Assays for Immunogenicity",
      "description": "Block 8 is called “8. Laboratory Assays for Immunogenicity” and is composed of 19 sections.",
      "sections": [
        {
          "section_name": "Description IgG assay",
          "question": "Description of IgG immunogenicity assay used (in-house/commercial dx ELISA)",
          "instructions": "Describe the IgG immunogenicity assay used, indicating whether it is in-house, commercial, diagnostic ELISA, etc., strictly based on the PDF.",
          "expected_answer_type": "free_text"
        },
        {
          "section_name": "IgG assay type",
          "question": "IgG assay used is in-house, commercial, other",
          "instructions": "Choose the best answer and respond only with one of: \"commercial\", \"in house\" or \"other\".",
          "expected_answer_type": "one_of",
          "allowed_values": [
            "commercial",
            "in house",
            "other"
          ]
        },
        {
          "section_name": "IgG assay purpose",
          "question": "Is the IgG assay used designed for immunogenicity studies or for diagnostic uses?",
          "instructions": "Choose the best answer and respond only with one of: \"diagnostic use\", \"Study designed use\", \"not specified\", \"not able to decide\".",
          "expected_answer_type": "one_of",
          "allowed_values": [
            "diagnostic use",
            "Study designed use",
            "not specified",
            "not able to decide"
          ]
        },
        {
          "section_name": "If not able to decide IgG assay purpose",
          "question": "If not able to decide the IgG assay used, please describe",
          "instructions": "If you chose \"not able to decide\", describe in free text why this decision cannot be made, strictly based on the PDF.",
          "expected_answer_type": "free_text"
        },
        {
          "section_name": "Lab technique classification",
          "question": "Classification of the Lab Technique of Immunogenicity Assay Used",
          "instructions": "Choose the best answer and respond only with one of: \"ELISA (Enzyme-linked immunosorbent assay)\", \"Multiplex immunoassays\", \"Luminex\", \"Electrochemiluminescence (ECLIA)\", \"other\".",
          "expected_answer_type": "one_of",
          "allowed_values": [
            "ELISA (Enzyme-linked immunosorbent assay)",
            "Multiplex immunoassays",
            "Luminex",
            "Electrochemiluminescence (ECLIA)",
            "other"
          ]
        },
        {
          "section_name": "Units used",
          "question": "Units Used to Measure or Report the IgG assays by the Lab",
          "instructions": "Choose the best answer and respond only with one of: \"EU/mL (ELISA units)\", \"IU/mL (International units)\", \"GMC (Geometric Mean Concentration)\", \"GMT (Geometric Mean Titer)\", \"other\".",
          "expected_answer_type": "one_of",
          "allowed_values": [
            "EU/mL (ELISA units)",
            "IU/mL (International units)",
            "GMC (Geometric Mean Concentration)",
            "GMT (Geometric Mean Titer)",
            "other"
          ]
        },
        {
          "section_name": "Laboratory validation/standardization description",
          "question": "Describe Laboratory Validation /Standarization",
          "instructions": "Describe in free text how the laboratory assay was validated or standardized, strictly based on the PDF.",
          "expected_answer_type": "free_text"
        },
        {
          "section_name": "Laboratory validation/standardization category",
          "question": "Choose the Laboratory Validation/Standarization",
          "instructions": "Choose the best answer and respond only with one of: \"WHO International Reference Standards used\", \"In-house assay validated\", \"University Validated\", \"other\".",
          "expected_answer_type": "one_of",
          "allowed_values": [
            "WHO International Reference Standards used",
            "In-house assay validated",
            "University Validated",
            "other"
          ]
        },
        {
          "section_name": "Extractor considers assay validated (yes/no)",
          "question": "Does the extractors considers it is validated?",
          "instructions": "Choose the best answer and respond only with one of: \"yes\", \"no\", \"not able to decide\".",
          "expected_answer_type": "one_of",
          "allowed_values": [
            "yes",
            "no",
            "not able to decide"
          ]
        },
        {
          "section_name": "If not able to decide validation",
          "question": "If not able to decide, describe why",
          "instructions": "If you chose \"not able to decide\", describe in free text why this decision cannot be made, strictly based on the PDF.",
          "expected_answer_type": "free_text"
        },
        {
          "section_name": "Antigens tested",
          "question": "Describe the antigens tested  (PT, FHA, PRN, FIM, B.pertussis (lysate or heat-killed bacteria, Antigen mix, etc…))",
          "instructions": "Describe in free text which antigens were tested (PT, FHA, PRN, FIM, B. pertussis lysate or heat-killed bacteria, antigen mix, etc.), strictly based on the PDF.",
          "expected_answer_type": "free_text"
        },
        {
          "section_name": "Antigens tested in lysate/mix (yes/no)",
          "question": "Are the antigens tested included in bacteris lysate, antigen mix or any mixture of antigens that cannot be separated?",
          "instructions": "Choose the best answer and respond only with one of: \"yes\", \"no\", \"not described\".",
          "expected_answer_type": "one_of",
          "allowed_values": [
            "yes",
            "no",
            "not described"
          ]
        },
        {
          "section_name": "Number of pertussis antigens tested",
          "question": "Number of Pertussis  Ags Tested",
          "instructions": "Choose the best answer and respond only with one of: \"1\", \"2\", \"3\", \"4\", \">4\", \"Unknown\".",
          "expected_answer_type": "one_of",
          "allowed_values": [
            "1",
            "2",
            "3",
            "4",
            ">4",
            "Unknown"
          ]
        },
        {
          "section_name": "Pertussis toxin (PT)",
          "question": "Pertussis toxin  (PT)",
          "instructions": "Choose the best answer and respond only with one of: \"yes\", \"no\", \"Unknown\".",
          "expected_answer_type": "one_of",
          "allowed_values": [
            "yes",
            "no",
            "Unknown"
          ]
        },
        {
          "section_name": "Filamentous haemagglutinin adhesin (FHA)",
          "question": "Filamentous haemagglutinin  adhesin (FHA)",
          "instructions": "Choose the best answer and respond only with one of: \"yes\", \"no\", \"Unknown\".",
          "expected_answer_type": "one_of",
          "allowed_values": [
            "yes",
            "no",
            "Unknown"
          ]
        },
        {
          "section_name": "Pertactin (PRN)",
          "question": "Pertactin  (PRN)",
          "instructions": "Choose the best answer and respond only with one of: \"yes\", \"no\", \"Unknown\".",
          "expected_answer_type": "one_of",
          "allowed_values": [
            "yes",
            "no",
            "Unknown"
          ]
        },
        {
          "section_name": "Fimbriae (FIM)",
          "question": "Fimbriae (FIM)",
          "instructions": "Choose the best answer and respond only with one of: \"yes\", \"no\", \"Unknown\".",
          "expected_answer_type": "one_of",
          "allowed_values": [
            "yes",
            "no",
            "Unknown"
          ]
        },
        {
          "section_name": "Other antigens tested",
          "question": "Other Ags Tested",
          "instructions": "Describe any other pertussis antigens tested, in free text, strictly based on the PDF.",
          "expected_answer_type": "free_text"
        },
        {
          "section_name": "Other immunogenicity humoral tests",
          "question": "Other Immunogenicity Humoral Tests",
          "instructions": "Describe in free text any other humoral immunogenicity tests performed, strictly based on the PDF.",
          "expected_answer_type": "free_text"
        }
      ]
    },
    {
      "block_number": 9,
      "block_name": "9. Immunogenicity Endpoints",
      "description": "Block 9 is called “9. Immunogenicity Endpoints” and is composed of 7 sections.",
      "sections": [
        {
          "section_name": "Seropositivity definition",
          "question": "Describe definition Seropositivity  (above a defined threshold)",
          "instructions": "Describe in free text the definition of seropositivity (e.g., above a defined threshold), strictly based on the PDF.",
          "expected_answer_type": "free_text"
        },
        {
          "section_name": "Seropositivity measured (yes/no)",
          "question": "Is seropositivity measured?",
          "instructions": "Choose the best answer and respond only with one of: \"yes\", \"no\".",
          "expected_answer_type": "one_of",
          "allowed_values": [
            "yes",
            "no"
          ]
        },
        {
          "section_name": "Seroconversion definition",
          "question": "Describe Definition Seroconversion (4X increase, 2X increase, above a defined threshold, or sometimes even more complex)",
          "instructions": "Describe in free text the definition of seroconversion used (e.g., 4X increase, 2X increase, above a defined threshold, etc.), strictly based on the PDF.",
          "expected_answer_type": "free_text"
        },
        {
          "section_name": "Seroconversion measured (yes/no)",
          "question": "Is seroconversion measured?",
          "instructions": "Choose the best answer and respond only with one of: \"yes\", \"no\".",
          "expected_answer_type": "one_of",
          "allowed_values": [
            "yes",
            "no"
          ]
        },
        {
          "section_name": "Type of seroconversion definition",
          "question": "If seroconversion is measured, is it 4X, 2X increased, a defined threshold or other?",
          "instructions": "Choose the best answer and respond only with one of: \"2X\", \"4X\", \"From Undetectable to Above a Threshold\", \"other\".",
          "expected_answer_type": "one_of",
          "allowed_values": [
            "2X",
            "4X",
            "From Undetectable to Above a Threshold",
            "other"
          ]
        },
        {
          "section_name": "Seroprotection definition",
          "question": "Describe definition Seroprotection (above a defined threshold)",
          "instructions": "Describe in free text the definition of seroprotection (above a defined threshold), strictly based on the PDF.",
          "expected_answer_type": "free_text"
        },
        {
          "section_name": "Seroprotection measured (yes/no)",
          "question": "Is seroprotection measured?",
          "instructions": "Choose the best answer and respond only with one of: \"yes\", \"no\".",
          "expected_answer_type": "one_of",
          "allowed_values": [
            "yes",
            "no"
          ]
        }
      ]
    },
    {
      "block_number": 10,
      "block_name": "10.Statistics",
      "description": "Block 10 is called “10.Statistics” and is composed of 6 sections.",
      "sections": [
        {
          "section_name": "Statistical measurements",
          "question": "Describe Statistical Measurements used in the study to report immunogenicity",
          "instructions": "Describe in free text the statistical measurements used in the study to report immunogenicity (e.g., GMC, GMT, proportions with CI, etc.), strictly based on the PDF.",
          "expected_answer_type": "free_text"
        },
        {
          "section_name": "Endpoint type",
          "question": "Describe Endpoint Type used in the study",
          "instructions": "Describe in free text the type of endpoints used in the study for immunogenicity, strictly based on the PDF.",
          "expected_answer_type": "free_text"
        },
        {
          "section_name": "95% CI for endpoint",
          "question": "Write the 95% CI for the Endpoint (when assesed)",
          "instructions": "Write in free text the 95% confidence intervals for the endpoints, strictly based on the PDF (when assessed).",
          "expected_answer_type": "free_text"
        },
        {
          "section_name": "Non-inferiority criteria met (yes/no)",
          "question": "Was Non-Inferiority Criteria Met?",
          "instructions": "Choose the best answer and respond only with one of: \"yes\", \"no\", \"not reported\".",
          "expected_answer_type": "one_of",
          "allowed_values": [
            "yes",
            "no",
            "not reported"
          ]
        },
        {
          "section_name": "Non-inferiority margin",
          "question": "What was the Non-Inferiority Margin?",
          "instructions": "Describe in free text the non-inferiority margin used, strictly based on the PDF.",
          "expected_answer_type": "free_text"
        },
        {
          "section_name": "Other statistical definitions",
          "question": "Other Relevant Statistical Definitions Used",
          "instructions": "Describe in free text any other relevant statistical definitions used in the study, strictly based on the PDF.",
          "expected_answer_type": "free_text"
        }
      ]
    },
    {
      "block_number": 11,
      "block_name": "others",
      "description": "Block 11 is called “others” and is composed of 5 sections.",
      "sections": [
        {
          "section_name": "Relevant immunogenicity outcomes",
          "question": "Describe relevant immunogenicity outcomes in the results",
          "instructions": "Describe in free text the relevant immunogenicity outcomes in the results, strictly based on the PDF.",
          "expected_answer_type": "free_text"
        },
        {
          "section_name": "Relevant conclusions for immunogenicity",
          "question": "Describe relevant Conclusions for Immunogenicity",
          "instructions": "Describe in free text the relevant conclusions for immunogenicity, strictly based on the PDF.",
          "expected_answer_type": "free_text"
        },
        {
          "section_name": "Limitations written in paper",
          "question": "Limitations for immunogenicity study (written in paper)",
          "instructions": "Describe in free text the limitations for the immunogenicity study as written in the paper, strictly based on the PDF.",
          "expected_answer_type": "free_text"
        },
        {
          "section_name": "Observed methodological problems (by extractor)",
          "question": "Observed Methodological Problems for Immunogenicity (by extractor)",
          "instructions": "Describe in free text the methodological problems for the immunogenicity study as observed by the extractor, strictly based on what can be inferred from the PDF (without adding external information).",
          "expected_answer_type": "free_text"
        },
        {
          "section_name": "Observed limitations (by extractor)",
          "question": "Observed Limitations for immunogenicity (by extractor)",
          "instructions": "Describe in free text the limitations for the immunogenicity study as observed by the extractor, strictly based on what can be inferred from the PDF (without adding external information).",
          "expected_answer_type": "free_text"
        }
      ]
    }
  ],
  "final_validation_requirement": "At the end, you must perform a validation process to ensure that no information has been invented and that 100% of the extracted information comes from the PDF that was provided."
};