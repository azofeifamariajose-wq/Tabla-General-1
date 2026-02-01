
import { SchemaDef } from './types';

export const MEDICAL_SCHEMA: SchemaDef = {
  "table_name": "TABLA GENERAL",
  "language": "en",
  "blocks": [
    {
      "block_number": 1,
      "block_name": "Info",
      "sections": [
        {
          "section_name": "ID",
          "questions": [
            {
              "key": "info_id",
              "label": "ID",
              "type": "text",
              "default": ""
            }
          ]
        },
        {
          "section_name": "Extractor",
          "questions": [
            {
              "key": "info_extractor",
              "label": "Extractor",
              "type": "text",
              "default": "MJA",
              "locked": true
            }
          ]
        },
        {
          "section_name": "Subject",
          "questions": [
            {
              "key": "info_subject",
              "label": "Subject",
              "type": "single_select",
              "options": [
                "whole-cell",
                "acellular",
                "both"
              ],
              "instruction": "Indicate if the PDF discusses a whole-cell vaccine, an acellular vaccine, or both."
            }
          ]
        }
      ]
    },
    {
      "block_number": 2,
      "block_name": "General Aspects of paper",
      "sections": [
        {
          "section_name": "General",
          "questions": [
            { "key": "general_title", "label": "Title", "type": "text" },
            { "key": "general_year", "label": "year", "type": "text" },
            { "key": "general_authors", "label": "authors", "type": "text" },
            { "key": "general_journal", "label": "journal", "type": "text" },
            {
              "key": "general_countries",
              "label": "Country(ies) where the study was done",
              "type": "text"
            }
          ]
        }
      ]
    },
    {
      "block_number": 3,
      "block_name": "Study Design",
      "sections": [
        {
            "section_name": "Design",
            "questions": [
            {
              "key": "sd_general_description",
              "label": "Write the general description of study design",
              "type": "text"
            },
            {
              "key": "sd_explicit_in_text",
              "label": "Is the study design explicit in the text?",
              "type": "single_select",
              "options": ["yes", "no"]
            },
            {
              "key": "sd_design_choose",
              "label": "Study Design (choose)",
              "type": "single_select",
              "options": [
                "Retrospective Cohort",
                "Prospective Cohort",
                "Case-Control",
                "RCTs",
                "Non-randomized Interventional Study",
                "Interventional Phase I",
                "Interventional Phase II",
                "Interventional Phase III",
                "Interventional Phase IV",
                "other"
              ]
            },
            {
              "key": "sd_blinding_reported_interventional",
              "label": "Is blinding reported in the study for interventional studies?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "sd_blinding_participants",
              "label": "Is blinding reported for participants?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "sd_blinding_personnel",
              "label": "Is blinding reported for personnel?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "sd_blinding_assessors",
              "label": "Is blinding reported for assessors?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "sd_randomization_adequately_described",
              "label": "Is randomization adequately described?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "sd_randomization_type_description",
              "label": "Type of randomization described",
              "type": "text"
            },
            {
              "key": "sd_allocation_concealed",
              "label": "Was allocation concealed?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            }
          ]
        }
      ]
    },
    {
      "block_number": 4,
      "block_name": "4. Population",
      "sections": [
        {
            "section_name": "Population",
            "questions": [
            {
              "key": "pop_description",
              "label": "Population Description",
              "type": "text"
            },
            {
              "key": "pop_age_range",
              "label": "Age Range of the Population",
              "type": "single_select",
              "options": [
                "<6 months",
                "<15months",
                "<24months",
                "2-6 years",
                "<6 years",
                "other",
                "not specified"
              ]
            },
            {
              "key": "pop_other_age_range_description",
              "label": "Other age range of the population, describe",
              "type": "text"
            },
            {
              "key": "pop_premature_included",
              "label": "Are premature children included in the study?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "pop_low_birth_infants_included",
              "label": "Are low birth infants included in the study?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "pop_premature_analyzed_separately",
              "label": "If premature children are included, are they analyzed separetely?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "pop_low_birth_analyzed_separately",
              "label": "If low birth children are included, are they analyzed separetely?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "pop_prior_pertussis_determined",
              "label": "Is prior pertussis infection determined before vaccination?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "pop_prior_pertussis_n",
              "label": "In case prior pertussis infection is determined, number of participants with prior infection",
              "type": "text"
            }
          ]
        }
      ]
    },
    {
      "block_number": 5,
      "block_name": "5.Intervention (general assesment for Immunogenicity and Safety)",
      "sections": [
        {
            "section_name": "Intervention",
            "questions": [
            {
              "key": "int_general_description",
              "label": "Intervention (general description in the paper)",
              "type": "text"
            },
            {
              "key": "int_includes_immunogenicity_eval",
              "label": "Does the intervention includes the evaluation of immunogenicity of a pertussis vaccine?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "int_includes_safety_eval",
              "label": "Does the intervention includes the evaluation of safety of a pertussis vaccine?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "int_is_standalone_pertussis",
              "label": "Is the intervention Standalone Pertussis Vaccine",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "int_is_combination_vaccine",
              "label": "Is the intervention a Combination Vaccine",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "int_coadministration_other_vaccines",
              "label": "Is there coadministration/ concomitant administration of other vaccines?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "int_coadmin_vaccines_details",
              "label": "Details of other vaccines are co-administered with pertussis vaccine",
              "type": "text"
            }
          ]
        }
      ]
    },
    {
      "block_number": 6,
      "block_name": "6.Immunological Interference Assesment in the Intervention",
      "sections": [
        {
            "section_name": "Immunological Interference",
            "questions": [
            {
              "key": "ii_analyzed_explicitly",
              "label": "Was immunological interfence explicitly analyzed in the study?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "ii_description",
              "label": "Description of the immunological interference analysis",
              "type": "text"
            },
            {
              "key": "ii_control_arm_pertussis_alone",
              "label": "Was a control arm used with pertussis vaccine alone?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "ii_noninferiority_pertussis_antigens",
              "label": "Was a non-inferiority analysis conducted for pertussis antigens",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "ii_other_antigens_affected",
              "label": "Were antibody responses to other antigens affected by co-administered vaccines?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "ii_timing_standardized",
              "label": "Was co-administration timing standardized?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "ii_how_standardized",
              "label": "How was co-administration standarized? (description)",
              "type": "text"
            }
          ]
        }
      ]
    },
    {
      "block_number": 7,
      "block_name": "7. Cumulatitive Reactogenicity Assesment",
      "sections": [
        {
            "section_name": "Reactogenicity",
            "questions": [
            {
              "key": "cr_safety_evaluated",
              "label": "Is safety of pertussis vaccine evaluated?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "cr_reactogenicity_pertussis_alone",
              "label": "Is reactogenicity reported for pertussis alone?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "cr_cumulative_reactogenicity_evaluated",
              "label": "Is cumulative reactogenicity evaluated in the article?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "cr_definition_cumulative",
              "label": "Definition of cumulative reactogenicity given in the article",
              "type": "single_select",
              "options":["Yes", "No"]
            },
            {
              "key": "cr_definition_reactogenicity_present",
              "label": "Is there a definition of reactogenicity given in the article?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "cr_definition_reactogenicity",
              "label": "Definition of reactogenicity given in the article",
              "type": "text"
            }
          ]
        }
      ]
    },
    {
      "block_number": 8,
      "block_name": "8.Antipyretic administration",
      "sections": [
        {
            "section_name": "Antipyretics",
            "questions": [
            {
              "key": "antipyretic_use_reported",
              "label": "Antipyretic Use Reported?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "antipyretic_timing",
              "label": "Timing of Antipyretic Administration",
              "type": "single_select",
              "options": ["Prophylactic", "Therapeutic", "Not reported", "other", "N/A"]
            },
            {
              "key": "antipyretic_detail_medication",
              "label": "Detail of Medication Used",
              "type": "text"
            },
            {
              "key": "antipyretic_type_medication",
              "label": "Type of Medication Used",
              "type": "single_select",
              "options": ["Acetaminophen", "ibuprofen", "naproxen", "other", "N/A", "Not described"]
            },
            {
              "key": "antipyretic_standardized_across_arms",
              "label": "Was Use of antipyrectics Standardized Across Arms or Groups of the Study?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "antipyretic_optional_or_recommended",
              "label": "Was Use Optional or Recommended?",
              "type": "single_select",
              "options": ["optional", "recommended", "mandatory", "unclear", "N/A"]
            },
            {
              "key": "antipyretic_impact_on_reactogenicity",
              "label": "Impact on Reactogenicity Outcomes",
              "type": "single_select",
              "options": ["reported", "not reported", "N/A"]
            }
          ]
        }
      ]
    },
    {
      "block_number": 9,
      "block_name": "9.Comparative or Control Group",
      "sections": [
        {
            "section_name": "Control Group",
            "questions": [
            {
              "key": "ccg_any_comparative_group",
              "label": "Is there a Comparative group or Control described in the article?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "ccg_general_description",
              "label": "General Description of Comparative of Control Group",
              "type": "text"
            },
            {
              "key": "ccg_type_first",
              "label": "Type of Comparative Group (for the first one)",
              "type": "single_select",
              "options": [
                "Whole-cell vs Acellular",
                "Different acellular vaccines",
                "Different whole cell vaccines",
                "Different vaccinations schedules",
                "Vaccine vs Placebo",
                "Co-administration vs non-coadministration",
                "Non-pertussis comparator",
                "other",
                "N/A"
              ]
            },
            {
              "key": "ccg_other_comparative_first_description",
              "label": "Other Comparative, description (for the first one)",
              "type": "text"
            },
            {
              "key": "ccg_more_than_one_comparative",
              "label": "Is there more than one comparative group?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "ccg_number_of_comparative_groups",
              "label": "Number of compartive groups described",
              "type": "text"
            },
            {
              "key": "ccg_type_second",
              "label": "Type of Comparative Group (for the second one)",
              "type": "single_select",
              "options": [
                "Whole-cell vs Acellular",
                "Different acellular vaccines",
                "Different whole cell vaccines",
                "Different vaccinations schedules",
                "Vaccine vs Placebo",
                "Co-administration vs non-coadministration",
                "Non-pertussis comparator",
                "other",
                "N/A"
              ]
            },
            {
              "key": "ccg_type_third",
              "label": "Type of Comparative Group (for the third one)",
              "type": "single_select",
              "options": [
                "Whole-cell vs Acellular",
                "Different acellular vaccines",
                "Different whole cell vaccines",
                "Different vaccinations schedules",
                "Vaccine vs Placebo",
                "Co-administration vs non-coadministration",
                "Non-pertussis comparator",
                "other",
                "N/A"
              ]
            },
            {
              "key": "ccg_other_comparative_remaining_description",
              "label": "Other Comparative, description (for the remaining ones)",
              "type": "text"
            },
            {
              "key": "ccg_balanced_at_baseline",
              "label": "Are participants balanced in the different groups at baseline?",
              "type": "single_select",
              "options": ["yes", "no", "not able to decide", "N/A"]
            },
            {
              "key": "ccg_if_not_able_comment",
              "label": "If not able to decide, write a small comment",
              "type": "text"
            }
          ]
        }
      ]
    },
    {
      "block_number": 10,
      "block_name": "10. Study Period (description)",
      "sections": [
        {
            "section_name": "Period",
            "questions": [
            {
              "key": "study_period_description",
              "label": "Study Period (description)",
              "type": "text"
            }
          ]
        }
      ]
    },
    {
      "block_number": 11,
      "block_name": "11. Statistics and Sample Size Calculation",
      "sections": [
        {
            "section_name": "Statistics",
            "questions": [
            {
              "key": "stats_sample_size_justification_reported",
              "label": "Is Sample Size Justification Reported?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "stats_power_reported",
              "label": "Is Power Reported?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "stats_power_value",
              "label": "Which is the Power % value?",
              "type": "text"
            },
            {
              "key": "stats_alpha_reported",
              "label": "Is Alpha Reported?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "stats_alpha_value",
              "label": "Which is the Alpha value",
              "type": "text"
            },
            {
              "key": "stats_effect_size_specified",
              "label": "Is the Effect Size Specified?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "stats_effect_size_value",
              "label": "Which is the Value Effect Size",
              "type": "text"
            },
            {
              "key": "stats_sd_or_variability_mentioned",
              "label": "Is SD or Variability Mentioned?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            }
          ]
        }
      ]
    },
    {
      "block_number": 12,
      "block_name": "12. Sample and Group Information",
      "sections": [
        {
            "section_name": "Sample",
            "questions": [
            {
              "key": "sample_divided_in_phases",
              "label": "Is the study divided in phases?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            { "key": "sample_how_many_phases", "label": "How many phases?", "type": "text" },
            { "key": "sample_describe_phases", "label": "Describe the phases of the study", "type": "text" },
            { "key": "sample_total_initial_phase1", "label": "Total Initial Sample (Phase 1)", "type": "text" },
            { "key": "sample_total_final_phase1", "label": "Total  Final Sample  Phase 1)", "type": "text" },
            { "key": "sample_total_initial_phase2", "label": "Total Initial Sample (Phase 2)", "type": "text" },
            { "key": "sample_total_final_phase2", "label": "Total  Final Sample (Phase 2)", "type": "text" },
            { "key": "sample_more_phases_details", "label": "Describe same details if there are more phases", "type": "text" },

            { "key": "sample_initial_per_group_phase1", "label": "Initial Sample size  (per group in Phase 1)", "type": "text" },
            { "key": "sample_initial_group1_phase1", "label": "Initial Sample size in Group 1 (Phase 1)", "type": "text" },
            { "key": "sample_initial_group2_phase1", "label": "Initial Sample size in Group 2 (Phase 1)", "type": "text" },
            { "key": "sample_initial_group3_phase1", "label": "Initial Sample size in Group 3 (Phase 1)", "type": "text" },
            { "key": "sample_initial_other_groups_phase1", "label": "Initial Sample size in other Groups (Phase 1)", "type": "text" },

            { "key": "sample_final_per_group_phase1", "label": "Final Sample size (per group in Phase 1)", "type": "text" },
            { "key": "sample_final_group1_phase1", "label": "Final Sample size in Group 1 (Phase 1)", "type": "text" },
            { "key": "sample_final_group2_phase1", "label": "Final Sample size in Group 2 (Phase 1)", "type": "text" },
            { "key": "sample_final_group3_phase1", "label": "Final Sample size in Group 3 (Phase 1)", "type": "text" },
            { "key": "sample_final_other_groups_phase1", "label": "Final Sample size in other Groups (Phase 1)", "type": "text" },

            {
              "key": "sample_groups_similar_phase1",
              "label": "Is the sample size between groups similar (phase 1)?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "sample_power_calc_between_groups_phase1",
              "label": "Was a power calculation done to detect differences between groups (phase 1)?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            { "key": "sample_mean_age_phase1", "label": "Mean age of the participants in phase 1", "type": "text" },

            { "key": "sample_initial_per_group_phase2", "label": "Initial Sample size  (per group in Phase 2)", "type": "text" },
            { "key": "sample_initial_group1_phase2", "label": "Initial Sample size in Group 1 (Phase 2)", "type": "text" },
            { "key": "sample_initial_group2_phase2", "label": "Initial Sample size in Group 2 (Phase 2)", "type": "text" },
            { "key": "sample_initial_group3_phase2", "label": "Initial Sample size in Group 3 (Phase 2)", "type": "text" },
            { "key": "sample_initial_other_groups_phase2", "label": "Initial Sample size in other Groups (Phase 2)", "type": "text" },

            { "key": "sample_final_per_group_phase3", "label": "Final Sample size  (per group in Phase 2)", "type": "text" },
            { "key": "sample_final_group1_phase3", "label": "Final Sample size in Group 1 (Phase 2)", "type": "text" },
            { "key": "sample_final_group2_phase3", "label": "Final Sample size in Group 2 (Phase 2)", "type": "text" },
            { "key": "sample_final_group3_phase3", "label": "Final Sample size in Group 3 (Phase 2)", "type": "text" },
            { "key": "sample_final_other_groups_phase3", "label": "Final Sample size in other Groups (Phase 2)", "type": "text" },
            {
              "key": "sample_groups_similar_phase2",
              "label": "Is the sample size between groups similar (phase 2)?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "sample_power_calc_between_groups_phase3",
              "label": "Was a power calculation done to detect differences between groups (phase 2)?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            { "key": "sample_mean_age_phase2", "label": "Mean age of the participants in phase 2", "type": "text" },

            { "key": "withdrawals_control_n", "label": "Number of Withdrawals in Control Group (n)", "type": "text" },
            { "key": "withdrawals_control_pct", "label": "Percentage of Withdrawals in Control Group (%)", "type": "text" },
            { "key": "withdrawals_control_reasons", "label": "Reasons for Withdrawls in Control Group", "type": "text" },

            { "key": "withdrawals_group1_n", "label": "Number of Withdrawals in Comparative Group 1 (n)", "type": "text" },
            { "key": "withdrawals_group1_pct", "label": "Percentage of Withdrawals in Comparative Group 1 (%)", "type": "text" },
            { "key": "withdrawals_group1_reasons", "label": "Reasons for Withdrawl in Group 1", "type": "text" },

            { "key": "withdrawals_group2_n", "label": "Number of Withdrawals in Comparative Group 2 (n)", "type": "text" },
            { "key": "withdrawals_group2_pct", "label": "Percentage of Withdrawals in Comparative Group 2 (%)", "type": "text" },
            { "key": "withdrawals_group2_reasons", "label": "Reasons for Withdrawl in Group 2", "type": "text" },

            { "key": "withdrawals_group3_n", "label": "Number of Withdrawals in Comparative Group 3 (n)", "type": "text" },
            { "key": "withdrawals_group3_pct", "label": "Percentage of Withdrawals in Comparative Group 3 (%)", "type": "text" },
            { "key": "withdrawals_group3_reasons", "label": "Reasons for Withdrawl in Group 3", "type": "text" },

            { "key": "withdrawals_more_groups_details", "label": "Same details if there is more than 4 groups", "type": "text" },
            {
              "key": "withdrawals_balanced_between_groups",
              "label": "Was Withdrawal Balanced Between Groups?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            }
          ]
        }
      ]
    },
    {
      "block_number": 13,
      "block_name": "13. Immunogenicity and Safety Outcomes",
      "sections": [
        {
            "section_name": "Outcomes",
            "questions": [
            { "key": "out_primary_description", "label": "Primary Outcome (proposed description in the paper)", "type": "text" },
            {
              "key": "out_primary_includes_immunogenicity",
              "label": "Does the primary outcome includes the evaluation of immunogenicity of a pertussis vaccine?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "out_primary_includes_safety",
              "label": "Does the primary outcome includes the evaluation of safety of a pertussis vaccine?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            { "key": "out_primary_immunogenicity_n", "label": "Number of participants in the immunogenicity outcome evaluation (n)", "type": "text" },
            { "key": "out_primary_immunogenicity_mean_age", "label": "Mean age of the participants at immnogenicity outcome measure", "type": "text" },
            { "key": "out_primary_safety_n", "label": "Number of participants in the  safety outcome evaluation (n)", "type": "text" },
            { "key": "out_primary_safety_mean_age", "label": "Mean age of the participants at  safety outcome measure", "type": "text" },

            { "key": "out_secondary_description", "label": "Secondary Outcome (proposed description in the paper)", "type": "text" },
            {
              "key": "out_secondary_includes_immunogenicity",
              "label": "Does the secondary outcome includes the evaluation of immunogenicity of a pertussis vaccine?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "out_secondary_includes_safety",
              "label": "Does the secondary outcome includes the evaluation of safety of a pertussis vaccine?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            { "key": "out_secondary_immunogenicity_n", "label": "Number of participants at secondary immnogenicity outcome measure", "type": "text" },
            { "key": "out_secondary_immunogenicity_mean_age", "label": "Mean age of the participants at secondary immnogenicity outcome measure", "type": "text" },
            { "key": "out_secondary_safety_n", "label": "Number of participants at secondary safety outcome measure", "type": "text" },
            { "key": "out_secondary_safety_mean_age", "label": "Mean age of the participants at secondary safety outcome measure", "type": "text" }
          ]
        }
      ]
    },
    {
      "block_number": 14,
      "block_name": "14.Characteristics of Vaccines Used in the Study",
      "notes": "Brand/manufacturer interpretation rules exist in the source text and should be applied during extraction/normalization.",
      "sections": [
        {
            "section_name": "Vaccine Characteristics",
            "questions": [
            {
              "key": "vac_g1_type_latam",
              "label": "Type of Vaccine Used Group 1*(in use in Latam)",
              "type": "multi_select", // Assuming multi_select is a valid string type in your logic
              "options": [
                "D",
                "T",
                "wP",
                "Hib",
                "HepB",
                "aP",
                "IPV",
                "Other",
                "N/A"
              ]
            },
            {
              "key": "vac_g1_brand_name",
              "label": "Name-Brand of the Vaccine Used in Group 1",
              "type": "single_select",
              "options": [
                "Adacel®",
                "Boostrix®",
                "ComBE Five®",
                "Daptacel®",
                "Easyfive-TT®",
                "Eupenta®",
                "Hexaxim®",
                "Infanrix®",
                "Infanrix®-IPV",
                "Infanrix® Hexa",
                "Infanrix Penta®",
                "Pediarix®",
                "Pentavac® PFS/SD",
                "Pentacel®",
                "Pentaxim®",
                "Pentalab®",
                "Quadracel®",
                "Quinvaxem®",
                "Tetraxim®",
                "Tritanrix®",
                "Vaxelis®",
                "Other",
                "N/A"
              ]
            },
            {
              "key": "vac_g1_manufacturer",
              "label": "Pharmaceutical Co /  Manufacturer of Vaccine Used in Group 1",
              "type": "single_select",
              "options": [
                "Biological E. Limited",
                "GSK",
                "LG Chem Ltd.",
                "Merck",
                "Merck and Sanofi Pasteur",
                "Panacea Biotec Ltd.",
                "PT Bio Farma (Persero)",
                "Sanofi Healthcare India Private Limited",
                "Sanofi Pasteur",
                "Serum Institute of India",
                "SK YS Pharm",
                "Other",
                "N/A"
              ]
            },
            {
              "key": "vac_g1_num_pertussis_ags",
              "label": "No. of pertussis ags included in the vaccine of Group 1",
              "type": "single_select",
              "options": ["1", "2", "3", "4", "5"]
            },
            {
              "key": "vac_g1_pertussis_antigens_types",
              "label": "Type(s) of pertussis antigens included in group 1 (PT, FHA, PRN, FIM2 and/or FIM3)",
              "type": "multi_select", // Assuming multi_select is a valid string type in your logic
              "options": ["PT", "FHA", "PRN", "FIM2", "FIM3"]
            },

            {
              "key": "vac_g2_type_latam",
              "label": "Type of Vaccine Used Group 2*(in use in Latam)",
              "type": "multi_select", // Assuming multi_select is a valid string type in your logic
              "options": [
                "D",
                "T",
                "wP",
                "Hib",
                "HepB",
                "aP",
                "IPV",
                "Other",
                "N/A"
              ]
            },
            {
              "key": "vac_g2_brand_name",
              "label": "Name-Brand of the Vaccine Used in Group 2",
              "type": "single_select",
              "options": [
                "Adacel®",
                "Boostrix®",
                "ComBE Five®",
                "Daptacel®",
                "Easyfive-TT®",
                "Eupenta®",
                "Hexaxim®",
                "Infanrix®",
                "Infanrix®-IPV",
                "Infanrix® Hexa",
                "Infanrix Penta®",
                "Pediarix®",
                "Pentavac® PFS/SD",
                "Pentacel®",
                "Pentaxim®",
                "Pentalab®",
                "Quadracel®",
                "Quinvaxem®",
                "Tetraxim®",
                "Tritanrix®",
                "Vaxelis®",
                "Other",
                "N/A"
              ]
            },
            {
              "key": "vac_g2_manufacturer",
              "label": "Pharmaceutical Co /  Manufacturer of Vaccine Used in Group 2",
              "type": "multiple_select",
              "options": [
                "D",
                "T",
                "wP",
                "Hib",
                "HepB",
                "aP",
                "IPV",
                "Other",
                "N/A"
              ]
            },
            {
              "key": "vac_g2_num_pertussis_ags",
              "label": "No. of pertussis ags included in the vaccine of Group 2",
              "type": "single_select",
              "options": ["1", "2", "3", "4", "5"]
            },
            {
              "key": "vac_g2_pertussis_antigens_types",
              "label": "Type(s) of pertussis antigens included in group 2 (PT, FHA, PRN, FIM2 and/or FIM3)",
              "type": "multi_select",
              "options": ["PT", "FHA", "PRN", "FIM2", "FIM3"]
            },

            {
              "key": "vac_g3_type_latam",
              "label": "Type of Vaccine Used Group 3*(in use in Latam)",
              "type": "multi_select", // Assuming multi_select is a valid string type in your logic
              "options": [
                "D",
                "T",
                "wP",
                "Hib",
                "HepB",
                "aP",
                "IPV",
                "Other",
                "N/A"
              ]
            },
            {
              "key": "vac_g3_brand_name",
              "label": "Name-Brand of the Vaccine Used in Group 3",
              "type": "single_select",
              "options": [
                "Adacel®",
                "Boostrix®",
                "ComBE Five®",
                "Daptacel®",
                "Easyfive-TT®",
                "Eupenta®",
                "Hexaxim®",
                "Infanrix®",
                "Infanrix®-IPV",
                "Infanrix® Hexa",
                "Infanrix Penta®",
                "Pediarix®",
                "Pentavac® PFS/SD",
                "Pentacel®",
                "Pentaxim®",
                "Pentalab®",
                "Quadracel®",
                "Quinvaxem®",
                "Tetraxim®",
                "Tritanrix®",
                "Vaxelis®",
                "Other",
                "N/A"
              ]
            },
            {
              "key": "vac_g3_manufacturer",
              "label": "Pharmaceutical Co /  Manufacturer of Vaccine Used in Group 3",
              "type": "single_select",
              "options": [
                "Biological E. Limited",
                "GSK",
                "LG Chem Ltd.",
                "Merck",
                "Merck and Sanofi Pasteur",
                "Panacea Biotec Ltd.",
                "PT Bio Farma (Persero)",
                "Sanofi Healthcare India Private Limited",
                "Sanofi Pasteur",
                "Serum Institute of India",
                "SK YS Pharm",
                "Other",
                "N/A"
              ]
            },
            {
              "key": "vac_g3_num_pertussis_ags",
              "label": "No. of pertussis ags included in the vaccine of Group 3",
              "type": "single_select",
              "options": ["1", "2", "3", "4", "5"]
            },
            {
              "key": "vac_g3_pertussis_antigens_types",
              "label": "Type(s) of pertussis antigens included in group 3 (PT, FHA, PRN, FIM2 and/or FIM3)",
              "type": "multi_select", // Assuming multi_select is a valid string type in your logic
              "options": ["PT", "FHA", "PRN", "FIM2", "FIM3"]
            },

            {
              "key": "vac_g4_type_latam",
              "label": "Type of Vaccine Used Group 4*(in use in Latam)",
             "type": "multi_select", // Assuming multi_select is a valid string type in your logic
              "options": [
                "D",
                "T",
                "wP",
                "Hib",
                "HepB",
                "aP",
                "IPV",
                "Other",
                "N/A"
              ]
            },
            {
              "key": "vac_g4_brand_name",
              "label": "Name-Brand of the Vaccine Used in Group 4",
              "type": "single_select",
              "options": [
                "Adacel®",
                "Boostrix®",
                "ComBE Five®",
                "Daptacel®",
                "Easyfive-TT®",
                "Eupenta®",
                "Hexaxim®",
                "Infanrix®",
                "Infanrix®-IPV",
                "Infanrix® Hexa",
                "Infanrix Penta®",
                "Pediarix®",
                "Pentavac® PFS/SD",
                "Pentacel®",
                "Pentaxim®",
                "Pentalab®",
                "Quadracel®",
                "Quinvaxem®",
                "Tetraxim®",
                "Tritanrix®",
                "Vaxelis®",
                "Other",
                "N/A"
              ]
            },
            {
              "key": "vac_g4_manufacturer",
              "label": "Pharmaceutical Co /  Manufacturer of Vaccine Used in Group 4",
              "type": "single_select",
              "options": [
                "Biological E. Limited",
                "GSK",
                "LG Chem Ltd.",
                "Merck",
                "Merck and Sanofi Pasteur",
                "Panacea Biotec Ltd.",
                "PT Bio Farma (Persero)",
                "Sanofi Healthcare India Private Limited",
                "Sanofi Pasteur",
                "Serum Institute of India",
                "SK YS Pharm",
                "Other",
                "N/A"
              ]
            },
            {
              "key": "vac_g4_num_pertussis_ags",
              "label": "No. of pertussis ags included in the vaccine of Group 4",
              "type": "single_select",
              "options": ["1", "2", "3", "4", "5"]
            },
            {
              "key": "vac_g4_pertussis_antigens_types",
              "label": "Type(s) of pertussis antigens included in group 4(PT, FHA, PRN, FIM2 and/or FIM3)",
              "type": "multi_select", // Assuming multi_select is a valid string type in your logic
              "options": ["PT", "FHA", "PRN", "FIM2", "FIM3"]
            },

            { "key": "vac_more_than_4_groups_description", "label": "Description: same details if the study includes more than 4 groups", "type": "text" },
            { "key": "vac_other_details", "label": "Other details on vaccines", "type": "text" },

            {
              "key": "vac_schedule_primary_booster_both",
              "label": "Schedule  (primary, booster, both)",
              "type": "single_select",
              "options": ["Primary", "Booster", "Both"]
            },
            {
              "key": "vac_children_naive_primary_only",
              "label": "Were children naive for pertussis vaccine, if they received only primary schedule?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "vac_children_naive_primary_and_booster",
              "label": "Were children naive for pertussis vaccine, if they received  primary schedule and booster?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "vac_same_type_booster_only",
              "label": "Were children vaccinated with the same pertussis vaccine, if they received only booster schedule?",
              "type": "single_select",
              "options": ["whole cell", "acellular", "any", "not described", "N/A"]
            },
            {
              "key": "vac_booster_only_primary_vaccine_type_known",
              "label": "For children that received the only the booster schedule, is their primary vaccination based on whole cell, acellular pertussis vaccine or any pertussis vaccine?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "vac_booster_only_basal_antibodies_measured",
              "label": "For children that received the only the booster schedule, are their basal antibodies measured at the beginning of the study?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },

            { "key": "vac_schedule_description_general", "label": "Description of the Pertussis Vaccine Schedule Used in the Study", "type": "text" },
            { "key": "vac_schedule_group1_detail", "label": "Detailed Schedule Description of Pertussis Vaccine for Group 1", "type": "text" },
            { "key": "vac_schedule_group2_detail", "label": "Detailed Schedule Description of Pertussis Vaccine for Group 2", "type": "text" },
            { "key": "vac_schedule_group3_detail", "label": "Detailed Schedule Description of Pertussis Vaccine for Group 3", "type": "text" },
            { "key": "vac_schedule_group4plus_detail", "label": "Detailed Schedule Description of Pertussis Vaccine for Groups 4 or more", "type": "text" }
          ]
        }
      ]
    },

    {
      "block_number": 15,
      "block_name": "15. 1st Pertussis Vaccine Dose, Primary Schedule",
      "sections": [
        {
            "section_name": "1st Dose",
            "questions": [
            {
              "key": "dose1_age_primary",
              "label": "Age at 1st Pertussis Vaccine Dose in Primary Schedule",
              "type": "single_select",
              "options": ["6 weeks", "2 months", "3 months", "other"]
            },
            {
              "key": "dose1_other_age_description",
              "label": "In case of other age for 1st Pertussis Vaccine Dose in Primary Schedule, describe",
              "type": "text"
            },

            {
              "key": "dose1_g1_type",
              "label": "Type of Pertussis Vaccine(s) received by Group 1 as 1st Dose in Primary Schedule",
              "type": "single_select",
              "options": ["whole cell", "acellular", "any", "not described"]
            },
            {
              "key": "dose1_g1_vaccine",
              "label": "Pertussis Vaccine(s) received by Group 1 as 1st Dose in Primary Schedule",
              "type": "multi_select", // Assuming multi_select is a valid string type in your logic
              "options": [
                "D",
                "T",
                "wP",
                "Hib",
                "HepB",
                "aP",
                "IPV",
                "Other",
                "N/A"
              ]
            },
            {
              "key": "dose1_g1_commercial_name",
              "label": "Commercial Name of Pertussis Vaccine(s) received by Group 1 as 1st Dose in Primary Schedule",
              "type": "single_select",
              "options": [
                "Adacel®",
                "Boostrix®",
                "ComBE Five®",
                "Daptacel®",
                "Easyfive-TT®",
                "Eupenta®",
                "Hexaxim®",
                "Infanrix®",
                "Infanrix®-IPV",
                "Infanrix® Hexa",
                "Infanrix Penta®",
                "Pediarix®",
                "Pentavac® PFS/SD",
                "Pentacel®",
                "Pentaxim®",
                "Pentalab®",
                "Quadracel®",
                "Quinvaxem®",
                "Tetraxim®",
                "Tritanrix®",
                "Vaxelis®",
                "Other",
                "N/A"
              ]
            },
            {
              "key": "dose1_g1_site",
              "label": "Site of administration of Pertussis Vaccine received by Group 1 as 1st Dose in Primary Schedule",
              "type": "single_select",
              "options": [
                "Right Deltoid",
                "Left Deltoid",
                "Any Side Deltoid",
                "Right Lateral Vast",
                "Left Lateral Vast",
                "Any Side Lateral Vast",
                "Other",
                "Not described",
                "N/A"
              ]
            },

            {
              "key": "dose1_g2_type",
              "label": "Type of Pertussis Vaccine(s) received by Group 2 as 1st Dose in Primary Schedule",
              "type": "single_select",
              "options": ["whole cell", "acellular", "any", "not described", "N/A"]
            },
            {
              "key": "dose1_g2_vaccine",
              "label": "Pertussis Vaccine(s) received by Group 2 as 1st Dose in Primary Schedule",
              "type": "multi_select", // Assuming multi_select is a valid string type in your logic
              "options": [
                "D",
                "T",
                "wP",
                "Hib",
                "HepB",
                "aP",
                "IPV",
                "Other",
                "N/A"
              ]
            },
            {
              "key": "dose1_g2_commercial_name",
              "label": "Commercial Name of Pertussis Vaccine(s) received by Group 2 as 1st Dose in Primary Schedule",
              "type": "single_select",
              "options": [
                "Adacel®",
                "Boostrix®",
                "ComBE Five®",
                "Daptacel®",
                "Easyfive-TT®",
                "Eupenta®",
                "Hexaxim®",
                "Infanrix®",
                "Infanrix®-IPV",
                "Infanrix® Hexa",
                "Infanrix Penta®",
                "Pediarix®",
                "Pentavac® PFS/SD",
                "Pentacel®",
                "Pentaxim®",
                "Pentalab®",
                "Quadracel®",
                "Quinvaxem®",
                "Tetraxim®",
                "Tritanrix®",
                "Vaxelis®",
                "Other",
                "N/A"
              ]
            },
            {
              "key": "dose1_g2_site",
              "label": "Site of administration of Pertussis Vaccine received by Group 2 as 1st Dose in Primary Schedule",
              "type": "single_select",
              "options": [
                "Right Deltoid",
                "Left Deltoid",
                "Any Side Deltoid",
                "Right Lateral Vast",
                "Left Lateral Vast",
                "Any Side Lateral Vast",
                "Other",
                "Not described",
                "N/A"
              ]
            },

            {
              "key": "dose1_g3_type",
              "label": "Type of Pertussis Vaccine(s) received by Group 3 as 1st Dose in Primary Schedule",
              "type": "single_select",
              "options": ["whole cell", "acellular", "any", "not described"]
            },
            {
              "key": "dose1_g3_vaccine",
              "label": "Pertussis Vaccine(s) received by Group 3 as 1st Dose in Primary Schedule",
              "type": "multi_select", // Assuming multi_select is a valid string type in your logic
              "options": [
                "D",
                "T",
                "wP",
                "Hib",
                "HepB",
                "aP",
                "IPV",
                "Other",
                "N/A"
              ]
            },
            {
              "key": "dose1_g3_commercial_name",
              "label": "Commercial Name of Pertussis Vaccine(s) received by Group 3 as 1st Dose in Primary Schedule",
              "type": "single_select",
              "options": [
                "Adacel®",
                "Boostrix®",
                "ComBE Five®",
                "Daptacel®",
                "Easyfive-TT®",
                "Eupenta®",
                "Hexaxim®",
                "Infanrix®",
                "Infanrix®-IPV",
                "Infanrix® Hexa",
                "Infanrix Penta®",
                "Pediarix®",
                "Pentavac® PFS/SD",
                "Pentacel®",
                "Pentaxim®",
                "Pentalab®",
                "Quadracel®",
                "Quinvaxem®",
                "Tetraxim®",
                "Tritanrix®",
                "Vaxelis®",
                "Other",
                "N/A"
              ]
            },
            {
              "key": "dose1_g3_site",
              "label": "Site of administration of Pertussis Vaccine received by Group 3 as 1st Dose in Primary Schedule",
              "type": "single_select",
              "options": [
                "Right Deltoid",
                "Left Deltoid",
                "Any Side Deltoid",
                "Right Lateral Vast",
                "Left Lateral Vast",
                "Any Side Lateral Vast",
                "Other",
                "Not described",
                "N/A"
              ]
            },

            {
              "key": "dose1_more_than_4_groups_description",
              "label": "Describe the Pertussis Vaccine(s) received by each group as 1st Dose in Primary Schedule in case the study has more than 4 groups (type, commercial name and site of administration)",
              "type": "text"
            }
          ]
        }
      ]
    },

    {
      "block_number": 16,
      "block_name": "16. 2nd Pertussis Vaccine Dose, Primary Schedule",
      "sections": [
        {
            "section_name": "2nd Dose",
            "questions": [
            {
              "key": "dose2_age_primary",
              "label": "Age of 2nd Pertussis Vaccine Dose in Primary Schedule",
              "type": "single_select",
              "options": ["10 weeks", "4 months", "5 months", "other"]
            },
            {
              "key": "dose2_other_age_description",
              "label": "In case of other age for 2st Pertussis Vaccine Dose in Primary Schedule, describe",
              "type": "text"
            },

            {
              "key": "dose2_g1_type",
              "label": "Type of Pertussis Vaccine(s) received by Group 1 as 2st Dose in Primary Schedule",
              "type": "single_select",
              "options": ["whole cell", "acellular", "any", "not described"]
            },
            {
              "key": "dose2_g1_vaccine",
              "label": "Pertussis Vaccine(s) received by Group 1 as 2nd Dose in Primary Schedule",
              "type": "multi_select", // Assuming multi_select is a valid string type in your logic
              "options": [
                "D",
                "T",
                "wP",
                "Hib",
                "HepB",
                "aP",
                "IPV",
                "Other",
                "N/A"
              ]
            },
            {
              "key": "dose2_g1_commercial_name",
              "label": "Commercial Name of Pertussis Vaccine(s) received by Group 1 as 2nd Dose in Primary Schedule",
              "type": "single_select",
              "options": [
                "Adacel®",
                "Boostrix®",
                "ComBE Five®",
                "Daptacel®",
                "Easyfive-TT®",
                "Eupenta®",
                "Hexaxim®",
                "Infanrix®",
                "Infanrix®-IPV",
                "Infanrix® Hexa",
                "Infanrix Penta®",
                "Pediarix®",
                "Pentavac® PFS/SD",
                "Pentacel®",
                "Pentaxim®",
                "Pentalab®",
                "Quadracel®",
                "Quinvaxem®",
                "Tetraxim®",
                "Tritanrix®",
                "Vaxelis®",
                "Other",
                "N/A"
              ]
            },
            {
              "key": "dose2_g1_site",
              "label": "Site of administration of Pertussis Vaccine received by Group 1 as 2nd Dose in Primary Schedule",
              "type": "single_select",
              "options": [
                "Right Deltoid",
                "Left Deltoid",
                "Any Side Deltoid",
                "Right Lateral Vast",
                "Left Lateral Vast",
                "Any Side Lateral Vast",
                "Other",
                "Not described",
                "N/A"
              ]
            },

            {
              "key": "dose2_g2_type",
              "label": "Type of Pertussis Vaccine(s) received by Group 2 as 2nd Dose in Primary Schedule",
              "type": "single_select",
              "options": ["whole cell", "acellular", "any", "not described", "N/A"]
            },
            {
              "key": "dose2_g2_vaccine",
              "label": "Pertussis Vaccine(s) received by Group 2 as 2nd Dose in Primary Schedule",
              "type": "multi_select", // Assuming multi_select is a valid string type in your logic
              "options": [
                "D",
                "T",
                "wP",
                "Hib",
                "HepB",
                "aP",
                "IPV",
                "Other",
                "N/A"
              ]
            },
            {
              "key": "dose2_g2_commercial_name",
              "label": "Commercial Name of Pertussis Vaccine(s) received by Group 2 as 2nd Dose in Primary Schedule",
              "type": "single_select",
              "options": [
                "Adacel®",
                "Boostrix®",
                "ComBE Five®",
                "Daptacel®",
                "Easyfive-TT®",
                "Eupenta®",
                "Hexaxim®",
                "Infanrix®",
                "Infanrix®-IPV",
                "Infanrix® Hexa",
                "Infanrix Penta®",
                "Pediarix®",
                "Pentavac® PFS/SD",
                "Pentacel®",
                "Pentaxim®",
                "Pentalab®",
                "Quadracel®",
                "Quinvaxem®",
                "Tetraxim®",
                "Tritanrix®",
                "Vaxelis®",
                "Other",
                "N/A"
              ]
            },
            {
              "key": "dose2_g2_site",
              "label": "Site of administration of Pertussis Vaccine received by Group 2 as 2nd Dose in Primary Schedule",
              "type": "single_select",
              "options": [
                "Right Deltoid",
                "Left Deltoid",
                "Any Side Deltoid",
                "Right Lateral Vast",
                "Left Lateral Vast",
                "Any Side Lateral Vast",
                "Other",
                "Not described",
                "N/A"
              ]
            },

            {
              "key": "dose2_g3_type",
              "label": "Type of Pertussis Vaccine(s) received by Group 3 as 2nd Dose in Primary Schedule",
              "type": "single_select",
              "options": ["whole cell", "acellular", "any", "not described"]
            },
            {
              "key": "dose2_g3_vaccine",
              "label": "Pertussis Vaccine(s) received by Group 3 as 2nd Dose in Primary Schedule",
              "type": "multi_select", // Assuming multi_select is a valid string type in your logic
              "options": [
                "D",
                "T",
                "wP",
                "Hib",
                "HepB",
                "aP",
                "IPV",
                "Other",
                "N/A"
              ]
            },
            {
              "key": "dose2_g3_commercial_name",
              "label": "Commercial Name of Pertussis Vaccine(s) received by Group 3 as 2nd Dose in Primary Schedule",
              "type": "single_select",
              "options": [
                "Adacel®",
                "Boostrix®",
                "ComBE Five®",
                "Daptacel®",
                "Easyfive-TT®",
                "Eupenta®",
                "Hexaxim®",
                "Infanrix®",
                "Infanrix®-IPV",
                "Infanrix® Hexa",
                "Infanrix Penta®",
                "Pediarix®",
                "Pentavac® PFS/SD",
                "Pentacel®",
                "Pentaxim®",
                "Pentalab®",
                "Quadracel®",
                "Quinvaxem®",
                "Tetraxim®",
                "Tritanrix®",
                "Vaxelis®",
                "Other",
                "N/A"
              ]
            },
            {
              "key": "dose2_g3_site",
              "label": "Site of administration of Pertussis Vaccine received by Group 3 as 2nd Dose in Primary Schedule",
              "type": "single_select",
              "options": [
                "Right Deltoid",
                "Left Deltoid",
                "Any Side Deltoid",
                "Right Lateral Vast",
                "Left Lateral Vast",
                "Any Side Lateral Vast",
                "Other",
                "Not described",
                "N/A"
              ]
            },

            {
              "key": "dose2_more_than_4_groups_description",
              "label": "Describe the Pertussis Vaccine(s) received by each group as 2nd Dose in Primary Schedule in case the study has more than 4 groups (type, commercial name and site of administration)",
              "type": "text"
            }
          ]
        }
      ]
    },

    {
      "block_number": 17,
      "block_name": "17. 3rd Pertussis Vaccine Dose, Primary Schedule",
      "sections": [
        {
            "section_name": "3rd Dose",
            "questions": [
            {
              "key": "dose3_age_primary",
              "label": "Age of 3rd  Pertussis Vaccine Dose in Primary Schedule",
              "type": "single_select",
              "options": ["14 weeks", "6 months", "7 months", "other"]
            },
            {
              "key": "dose3_other_age_description",
              "label": "In case of other age for 3rd Pertussis Vaccine Dose in Primary Schedule, describe",
              "type": "text"
            },

            {
              "key": "dose3_g1_type",
              "label": "Type of Pertussis Vaccine(s) received by Group 1 as 3rd Dose in Primary Schedule",
              "type": "single_select",
              "options": ["whole cell", "acellular", "any", "not described"]
            },
            {
              "key": "dose3_g1_vaccine",
              "label": "Pertussis Vaccine(s) received by Group 1 as 3rd Dose in Primary Schedule",
              "type": "multi_select", // Assuming multi_select is a valid string type in your logic
              "options": [
                "D",
                "T",
                "wP",
                "Hib",
                "HepB",
                "aP",
                "IPV",
                "Other",
                "N/A"
              ]
            },
            {
              "key": "dose3_g1_commercial_name",
              "label": "Commercial Name of Pertussis Vaccine(s) received by Group 1 as 3rd Dose in Primary Schedule",
              "type": "single_select",
              "options": [
                "Adacel®",
                "Boostrix®",
                "ComBE Five®",
                "Daptacel®",
                "Easyfive-TT®",
                "Eupenta®",
                "Hexaxim®",
                "Infanrix®",
                "Infanrix®-IPV",
                "Infanrix® Hexa",
                "Infanrix Penta®",
                "Pediarix®",
                "Pentavac® PFS/SD",
                "Pentacel®",
                "Pentaxim®",
                "Pentalab®",
                "Quadracel®",
                "Quinvaxem®",
                "Tetraxim®",
                "Tritanrix®",
                "Vaxelis®",
                "Other",
                "N/A"
              ]
            },
            {
              "key": "dose3_g1_site",
              "label": "Site of administration of Pertussis Vaccine received by Group 1 as 3rd Dose in Primary Schedule",
              "type": "single_select",
              "options": [
                "Right Deltoid",
                "Left Deltoid",
                "Any Side Deltoid",
                "Right Lateral Vast",
                "Left Lateral Vast",
                "Any Side Lateral Vast",
                "Other",
                "Not described",
                "N/A"
              ]
            },

            {
              "key": "dose3_g2_type",
              "label": "Type of Pertussis Vaccine(s) received by Group 2 as 3rd Dose in Primary Schedule",
              "type": "single_select",
              "options": ["whole cell", "acellular", "any", "not described", "N/A"]
            },
            {
              "key": "dose3_g2_vaccine",
              "label": "Pertussis Vaccine(s) received by Group 2 as 3rd Dose in Primary Schedule",
              "type": "multi_select", // Assuming multi_select is a valid string type in your logic
              "options": [
                "D",
                "T",
                "wP",
                "Hib",
                "HepB",
                "aP",
                "IPV",
                "Other",
                "N/A"
              ]
            },
            {
              "key": "dose3_g2_commercial_name",
              "label": "Commercial Name of Pertussis Vaccine(s) received by Group 2 as 3rd Dose in Primary Schedule",
              "type": "single_select",
              "options": [
                "Adacel®",
                "Boostrix®",
                "ComBE Five®",
                "Daptacel®",
                "Easyfive-TT®",
                "Eupenta®",
                "Hexaxim®",
                "Infanrix®",
                "Infanrix®-IPV",
                "Infanrix® Hexa",
                "Infanrix Penta®",
                "Pediarix®",
                "Pentavac® PFS/SD",
                "Pentacel®",
                "Pentaxim®",
                "Pentalab®",
                "Quadracel®",
                "Quinvaxem®",
                "Tetraxim®",
                "Tritanrix®",
                "Vaxelis®",
                "Other",
                "N/A"
              ]
            },
            {
              "key": "dose3_g2_site",
              "label": "Site of administration of Pertussis Vaccine received by Group 2 as 3rd Dose in Primary Schedule",
              "type": "single_select",
              "options": [
                "Right Deltoid",
                "Left Deltoid",
                "Any Side Deltoid",
                "Right Lateral Vast",
                "Left Lateral Vast",
                "Any Side Lateral Vast",
                "Other",
                "Not described",
                "N/A"
              ]
            },

            {
              "key": "dose3_g3_type",
              "label": "Type of Pertussis Vaccine(s) received by Group 3 as 3rd Dose in Primary Schedule",
              "type": "single_select",
              "options": ["whole cell", "acellular", "any", "not described"]
            },
            {
              "key": "dose3_g3_vaccine",
              "label": "Pertussis Vaccine(s) received by Group 3 as 3rd Dose in Primary Schedule",
              "type": "multi_select", // Assuming multi_select is a valid string type in your logic
              "options": [
                "D",
                "T",
                "wP",
                "Hib",
                "HepB",
                "aP",
                "IPV",
                "Other",
                "N/A"
              ]
            },
            {
              "key": "dose3_g3_commercial_name",
              "label": "Commercial Name of Pertussis Vaccine(s) received by Group 3 as 3rd Dose in Primary Schedule",
              "type": "single_select",
              "options": [
                "Adacel®",
                "Boostrix®",
                "ComBE Five®",
                "Daptacel®",
                "Easyfive-TT®",
                "Eupenta®",
                "Hexaxim®",
                "Infanrix®",
                "Infanrix®-IPV",
                "Infanrix® Hexa",
                "Infanrix Penta®",
                "Pediarix®",
                "Pentavac® PFS/SD",
                "Pentacel®",
                "Pentaxim®",
                "Pentalab®",
                "Quadracel®",
                "Quinvaxem®",
                "Tetraxim®",
                "Tritanrix®",
                "Vaxelis®",
                "Other",
                "N/A"
              ]
            },
            {
              "key": "dose3_g3_site",
              "label": "Site of administration of Pertussis Vaccine received by Group 3 as 3rd Dose in Primary Schedule",
              "type": "single_select",
              "options": [
                "Right Deltoid",
                "Left Deltoid",
                "Any Side Deltoid",
                "Right Lateral Vast",
                "Left Lateral Vast",
                "Any Side Lateral Vast",
                "Other",
                "Not described",
                "N/A"
              ]
            },

            {
              "key": "dose3_more_than_4_groups_description",
              "label": "Describe the Pertussis Vaccine(s) received by each group as 3rd Dose in Primary Schedule in case the study has more than 4 groups (type, commercial name and site of administration)",
              "type": "text"
            }
          ]
        }
      ]
    },

    {
      "block_number": 18,
      "block_name": "18. Booster Schedule",
      "sections": [
        {
            "section_name": "Booster",
            "questions": [
            {
              "key": "booster_age_completion_primary",
              "label": "Age at completion of Pertussis Vaccine Primary Schedule",
              "type": "single_select",
              "options": ["<4 months", "6 months", "7-8 months", "other"]
            },
            {
              "key": "booster_only_primary_evaluated",
              "label": "Does the study evaluates only primary schedule?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "booster_age_dose",
              "label": "Age of  Pertussis Vaccine Dose in Booster Schedule",
              "type": "single_select",
              "options": ["12-18 months", "15-18 months", "18-24 months", "6-12 months", "other"]
            },
            {
              "key": "booster_other_age_description",
              "label": "In case of other age for Booster Schedule, describe",
              "type": "text"
            },

            {
              "key": "booster_g1_type",
              "label": "Type of Pertussis Vaccine(s) received by Group 1 as Booster",
              "type": "single_select",
              "options": ["whole cell", "acellular", "any", "not described", "N/A"]
            },
            {
              "key": "booster_g1_vaccine",
              "label": "Pertussis Vaccine(s) received by Group 1 as as Booster",
              "type": "multi_select", // Assuming multi_select is a valid string type in your logic
              "options": [
                "D",
                "T",
                "wP",
                "Hib",
                "HepB",
                "aP",
                "IPV",
                "Other",
                "N/A"
              ]
            },
            {
              "key": "booster_g1_commercial_name",
              "label": "Commercial Name of Pertussis Vaccine(s) received by Group 1 as Booster",
              "type": "single_select",
              "options": [
                "Adacel®",
                "Boostrix®",
                "ComBE Five®",
                "Daptacel®",
                "Easyfive-TT®",
                "Eupenta®",
                "Hexaxim®",
                "Infanrix®",
                "Infanrix®-IPV",
                "Infanrix® Hexa",
                "Infanrix Penta®",
                "Pediarix®",
                "Pentavac® PFS/SD",
                "Pentacel®",
                "Pentaxim®",
                "Pentalab®",
                "Quadracel®",
                "Quinvaxem®",
                "Tetraxim®",
                "Tritanrix®",
                "Vaxelis®",
                "Other",
                "N/A"
              ]
            },
            {
              "key": "booster_g1_site",
              "label": "Site of administration of Pertussis Vaccine received by Group 1 as Booster Dose",
              "type": "single_select",
              "options": [
                "Right Deltoid",
                "Left Deltoid",
                "Any Side Deltoid",
                "Right Lateral Vast",
                "Left Lateral Vast",
                "Any Side Lateral Vast",
                "Other",
                "Not described",
                "N/A"
              ]
            },

            {
              "key": "booster_g2_type",
              "label": "Type of Pertussis Vaccine(s) received by Group 2 as Booster",
              "type": "single_select",
              "options": ["whole cell", "acellular", "any", "not described", "N/A"]
            },
            {
              "key": "booster_g2_vaccine",
              "label": "Pertussis Vaccine(s) received by Group 2 as Booster",
              "type": "multi_select", // Assuming multi_select is a valid string type in your logic
              "options": [
                "D",
                "T",
                "wP",
                "Hib",
                "HepB",
                "aP",
                "IPV",
                "Other",
                "N/A"
              ]
            },
            {
              "key": "booster_g2_commercial_name",
              "label": "Commercial Name of Pertussis Vaccine(s) received by Group 2 as Booster",
              "type": "single_select",
              "options": [
                "Adacel®",
                "Boostrix®",
                "ComBE Five®",
                "Daptacel®",
                "Easyfive-TT®",
                "Eupenta®",
                "Hexaxim®",
                "Infanrix®",
                "Infanrix®-IPV",
                "Infanrix® Hexa",
                "Infanrix Penta®",
                "Pediarix®",
                "Pentavac® PFS/SD",
                "Pentacel®",
                "Pentaxim®",
                "Pentalab®",
                "Quadracel®",
                "Quinvaxem®",
                "Tetraxim®",
                "Tritanrix®",
                "Vaxelis®",
                "Other",
                "N/A"
              ]
            },
            {
              "key": "booster_g2_site",
              "label": "Site of administration of Pertussis Vaccine received by Group 2 as Booster Dose",
              "type": "single_select",
              "options": [
                "Right Deltoid",
                "Left Deltoid",
                "Any Side Deltoid",
                "Right Lateral Vast",
                "Left Lateral Vast",
                "Any Side Lateral Vast",
                "Other",
                "Not described",
                "N/A"
              ]
            },

            {
              "key": "booster_g3_type",
              "label": "Type of Pertussis Vaccine(s) received by Group 3 as Booster",
              "type": "single_select",
              "options": ["whole cell", "acellular", "any", "not described", "N/A"]
            },
            {
              "key": "booster_g3_vaccine",
              "label": "Pertussis Vaccine(s) received by Group 3 as Booster",
              "type": "multi_select", // Assuming multi_select is a valid string type in your logic
              "options": [
                "D",
                "T",
                "wP",
                "Hib",
                "HepB",
                "aP",
                "IPV",
                "Other",
                "N/A"
              ]
            },
            {
              "key": "booster_g3_commercial_name",
              "label": "Commercial Name of Pertussis Vaccine(s) received by Group 3 as  Booster",
              "type": "single_select",
              "options": [
                "Adacel®",
                "Boostrix®",
                "ComBE Five®",
                "Daptacel®",
                "Easyfive-TT®",
                "Eupenta®",
                "Hexaxim®",
                "Infanrix®",
                "Infanrix®-IPV",
                "Infanrix® Hexa",
                "Infanrix Penta®",
                "Pediarix®",
                "Pentavac® PFS/SD",
                "Pentacel®",
                "Pentaxim®",
                "Pentalab®",
                "Quadracel®",
                "Quinvaxem®",
                "Tetraxim®",
                "Tritanrix®",
                "Vaxelis®",
                "Other",
                "N/A"
              ]
            },
            {
              "key": "booster_g3_site",
              "label": "Site of administration of Pertussis Vaccine received by Group 3 as Booster Dose",
              "type": "single_select",
              "options": [
                "Right Deltoid",
                "Left Deltoid",
                "Any Side Deltoid",
                "Right Lateral Vast",
                "Left Lateral Vast",
                "Any Side Lateral Vast",
                "Other",
                "Not described",
                "N/A"
              ]
            },

            {
              "key": "booster_more_than_4_groups_description",
              "label": "Describe the Pertussis Vaccine(s) received by each group as Booster in case the study has more than 4 groups (type and commercial name)",
              "type": "text"
            },
            {
              "key": "booster_age_completion",
              "label": "Age of Completion of the Booster Schedule",
              "type": "single_select",
              "options": ["12 months", "18 months", "24 months", "other"]
            },
            {
              "key": "booster_other_completion_age_description",
              "label": "In case of other age of completion of the booster schedule,  describe",
              "type": "text"
            },
            {
              "key": "booster_only_booster_evaluated",
              "label": "Does the study evaluates only booster schedule?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            }
          ]
        }
      ]
    },

    {
      "block_number": 19,
      "block_name": "19. Primary + Booster",
      "sections": [
        {
            "section_name": "Primary + Booster",
            "questions": [
            {
              "key": "pb_evaluates_both",
              "label": "Does the study evaluates both primary + booster schedule?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "pb_age_completion",
              "label": "Age of Completion of Primary + Booster Schedule",
              "type": "single_select",
              "options": ["12-18months", "15-18 months", "18-24 months", "6-12 months", "other", "N/A"]
            },
            {
              "key": "pb_other_completion_age_description",
              "label": "In case of other age of completion of the primary + booster schedule,  describe",
              "type": "text"
            }
          ]
        }
      ]
    },

    {
      "block_number": 20,
      "block_name": "20. Primary Outcome",
      "sections": [
        {
            "section_name": "Primary Outcome",
            "questions": [
            { "key": "po_results_description", "label": "Results of Primary Outcome (description)", "type": "text" },
            {
              "key": "po_achieved_immunogenicity",
              "label": "Was Primary Outcone Achieved by Study Vaccine In Immunogenicity?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "po_achieved_safety",
              "label": "Was Primary Outcone Achieved by Study Vaccine In Safety?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "po_primary_series_completed_for_immunogenicity",
              "label": "If the study analyzed primary schedule, all participants included for the immunogenicity analysis completed the primary series?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "po_booster_series_completed_for_immunogenicity",
              "label": "If the study analyzed booster schedule, all participants included for the immunogenicity analysis completed the booster series?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "po_both_series_completed_for_immunogenicity",
              "label": "If the study analyzed primary and booster schedules, all participants included for the immunogenicity analysis completed both?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "po_primary_series_completed_for_safety",
              "label": "If the study analyzed primary scheduel, all participants included for the safety analysis completed the primary series?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "po_booster_series_completed_for_safety",
              "label": "If the study analyzed booster schedule, all participants included for the safety analysis completed the booster series?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            },
            {
              "key": "po_both_series_completed_for_safety",
              "label": "If the study analyzed primary and booster schedules, all participants included for the safety analysis completed both?",
              "type": "single_select",
              "options": ["Yes", "No", "Not described", "N/A", "Other", "Unknown"]
            }
          ]
        }
      ]
    },

    {
      "block_number": 21,
      "block_name": "21. Results of Secondary Outcomes (description)",
      "sections": [
        {
            "section_name": "Secondary Outcomes",
            "questions": [
            { "key": "secondary_outcomes_results_description", "label": "21. Results of Secondary Outcomes (description)", "type": "text" }
          ]
        }
      ]
    },
    {
      "block_number": 22,
      "block_name": "22 conclusions",
      "sections": [
        {
            "section_name": "Conclusions",
            "questions": [
            { "key": "conclusions", "label": "Conclusions", "type": "text" }
          ]
        }
      ]
    },
    {
      "block_number": 23,
      "block_name": "23. Limitations (written in paper)",
      "sections": [
        {
            "section_name": "Limitations (Paper)",
            "questions": [
            { "key": "limitations_written_in_paper", "label": "Limitations (written in paper)", "type": "text" }
          ]
        }
      ]
    },
    {
      "block_number": 24,
      "block_name": "24. Observed Methodological Problems (by extractor)",
      "sections": [
        {
            "section_name": "Methodological Problems",
            "questions": [
            { "key": "observed_methodological_problems_by_extractor", "label": "Observed Methodological Problems (by extractor)", "type": "text" }
          ]
        }
      ]
    },
    {
      "block_number": 25,
      "block_name": "Observed Limitatons  (by extractor)",
      "sections": [
        {
            "section_name": "Observed Limitations",
            "questions": [
            { "key": "observed_limitatons_by_extractor", "label": "Observed Methodological Problems (by extractor)", "type": "text" }
          ]
        }
      ]
    },
    {
      "block_number": 26,
      "block_name": "notes",
      "sections": [
        {
            "section_name": "Notes",
            "questions": [
            { "key": "notes_relevant", "label": "notes (relevant notes from the article)", "type": "text" }
          ]
        }
      ]
    }
  ]
}
