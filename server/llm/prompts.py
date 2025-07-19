from typing import Dict

class PIIDetectionPrompts:
    """Collection of prompts for PII detection tasks"""
    
    @staticmethod
    def get_comprehensive_pii_prompt(text: str) -> str:
        """Main prompt for comprehensive PII detection"""
        return f"""
You are an expert at detecting personally identifiable information (PII) in text extracted from images like ID cards, documents, or forms.

TEXT TO ANALYZE:
"{text}"

TASK: Identify ALL PII in the text above. Look for:
1. Names (person names) - in ANY language (English, Hindi, regional languages)
2. Addresses (complete addresses) - preserve exact format and language
3. Phone numbers (any format including +91, 10-digit)
4. Email addresses
5. Aadhaar numbers (12-digit Indian ID)
6. PAN numbers (Indian tax ID format)
7. Date of birth (DD/MM/YYYY, DD-MM-YYYY, etc.)
8. Government ID numbers
9. Any other sensitive personal information like father or mother names, etc.

IMPORTANT RULES:
- Return values in the EXACT SAME LANGUAGE and format as found in the OCR text
- Do NOT translate or modify the text
- Preserve original spacing, punctuation, and character encoding
- If text is in Hindi/regional languages, keep it as-is
- If text has special characters or formatting, preserve them

RESPONSE FORMAT: Return ONLY a JSON array with this exact structure:
[
  {{"type": "name", "value": "actual_name_found_in_original_language"}},
  {{"type": "phone", "value": "actual_phone_found"}},
  {{"type": "email", "value": "actual_email_found"}},
  {{"type": "address", "value": "actual_address_found_in_original_language"}},
  {{"type": "aadhaar", "value": "actual_aadhaar_found"}},
  {{"type": "pan", "value": "actual_pan_found"}},
  {{"type": "dob", "value": "actual_dob_found"}}
]

If no PII found, return: []

IMPORTANT: Return ONLY the JSON array, no other text. Do NOT translate any values.
"""

    @staticmethod
    def get_focused_pii_prompt(text: str, focus_types: list) -> str:
        """Focused prompt for specific PII types"""
        focus_descriptions = {
            "name": "Person names in any language",
            "phone": "Phone numbers (any format)",
            "email": "Email addresses",
            "address": "Complete addresses",
            "aadhaar": "12-digit Aadhaar numbers",
            "pan": "PAN numbers (ABCDE1234F format)",
            "dob": "Dates of birth"
        }
        
        focus_list = "\n".join([f"- {focus_descriptions.get(t, t)}" for t in focus_types])
        
        return f"""
Extract specific PII types from this text:

TEXT: "{text}"

FOCUS ON THESE TYPES:
{focus_list}

Return JSON array format:
[{{"type": "type_name", "value": "exact_value_found"}}]

Preserve original language and formatting. Return only JSON array.
"""

    @staticmethod
    def get_validation_prompt(text: str, suspected_pii: list) -> str:
        """Prompt to validate suspected PII items"""
        pii_list = "\n".join([f"- {item['type']}: '{item['value']}'" for item in suspected_pii])
        
        return f"""
Validate if these items are actually PII in this context:

ORIGINAL TEXT: "{text}"

SUSPECTED PII:
{pii_list}

For each item, determine if it's truly PII or just a label/field name.
Return JSON array with only VALID PII items:
[{{"type": "name", "value": "John Doe", "confidence": "high"}}]

Return only JSON array.
"""

class PromptTemplates:
    """Additional prompt templates for different scenarios"""
    
    @staticmethod
    def get_multilingual_prompt(text: str, languages: list) -> str:
        """Prompt optimized for multilingual documents"""
        lang_list = ", ".join(languages)
        
        return f"""
Analyze this multilingual text for PII. Expected languages: {lang_list}

TEXT: "{text}"

Preserve original scripts and languages. Do not translate.
Return JSON array with PII found in their original language.
"""
    
    @staticmethod
    def get_document_type_prompt(text: str, doc_type: str) -> str:
        """Prompt optimized for specific document types"""
        type_specific_instructions = {
            "aadhaar": "Focus on Aadhaar number, name, address, DOB, father's name",
            "pan": "Focus on PAN number, name, father's name, DOB",
            "passport": "Focus on passport number, name, place of birth, address",
            "driving_license": "Focus on license number, name, address, DOB",
            "voter_id": "Focus on voter ID, name, address, father's name"
        }
        
        specific_instruction = type_specific_instructions.get(doc_type, "General PII detection")
        
        return f"""
Analyze this {doc_type.replace('_', ' ').title()} document for PII.

TEXT: "{text}"

FOCUS: {specific_instruction}

Return JSON array with detected PII in original format.
"""

# Export main prompt function for backward compatibility
def get_pii_detection_prompt(text: str) -> str:
    """Main PII detection prompt - for backward compatibility"""
    return PIIDetectionPrompts.get_comprehensive_pii_prompt(text)