import json
from typing import List, Dict, Optional
from .ollama_client import OllamaClient
from .prompts import PIIDetectionPrompts
from pii_utils import detect_pii

class OllamaLLMPIIDetector:
    """Main PII detection class using Ollama LLM"""
    
    def __init__(self, model_name: str = "llama3.2:3b", base_url: str = "http://localhost:11434"):
        self.model_name = "gemma3n:e2b"
        self.client = OllamaClient(base_url)
        self.prompts = PIIDetectionPrompts()
    
    def check_ollama_status(self) -> bool:
        """Check if Ollama is available and model exists"""
        if not self.client.check_connection():
            return False
        return self.client.is_model_available(self.model_name)
    
    def detect_pii_with_llm(self, text: str, use_focused: bool = False, focus_types: Optional[List[str]] = None) -> List[Dict[str, str]]:
        """Use Ollama LLM to detect PII with context awareness"""
        
        if not self.check_ollama_status():
            print(f"⚠️  Ollama not available or model {self.model_name} not found. Using regex fallback.")
            return detect_pii(text)
        
        if use_focused and focus_types:
            prompt = self.prompts.get_focused_pii_prompt(text, focus_types)
        else:
            prompt = self.prompts.get_comprehensive_pii_prompt(text)

        result = self.client.generate(
            model=self.model_name,
            prompt=prompt,
            temperature=0.1,
            options={
                "num_predict": 500,
                "stop": ["\n\n", "```"]
            }
        )
        
        if result and result.get("success"):
            llm_response = result["response"]
            
            # Enhanced logging - print raw response
            print(f"🤖 Model Used: {self.model_name}")
            print(f"📝 LLM Raw Response:")
            print("=" * 50)
            print(llm_response)
            print("=" * 50)
            
            # Parse the LLM response
            parsed_result = self._parse_llm_response(llm_response)
            print(f"✅ Successfully parsed {len(parsed_result)} PII items from LLM response")
            return parsed_result
        else:
            error_msg = result.get("error", "Unknown error") if result else "No response"
            print(f"❌ LLM request failed: {error_msg}")
            return detect_pii(text)
    
    def _parse_llm_response(self, response: str) -> List[Dict[str, str]]:
        """Parse LLM response and extract PII items"""
        print(f"🔍 Parsing LLM response...")
        
        try:
            # Clean the response - remove any markdown formatting
            response = response.replace("```json", "").replace("```", "").strip()
            
            # Find JSON array in the response
            json_start = response.find('[')
            json_end = response.rfind(']') + 1
            
            if json_start != -1 and json_end > json_start:
                json_str = response[json_start:json_end]
                print(f"🔍 Extracted JSON string: {json_str}")
                
                pii_items = json.loads(json_str)
                
                if isinstance(pii_items, list):
                    validated_items = []
                    for item in pii_items:
                        if isinstance(item, dict) and "type" in item and "value" in item:
                            validated_items.append({
                                "type": item["type"],
                                "value": item["value"]  # Preserve original language/format
                            })
                            print(f"✅ Valid PII item: {item['type']} = '{item['value']}'")
                        else:
                            print(f"⚠️  Invalid PII item structure: {item}")
                    
                    return validated_items
            else:
                print(f"⚠️  No JSON array found in response")
            
            return []
            
        except json.JSONDecodeError as e:
            print(f"❌ Failed to parse LLM response as JSON: {e}")
            print(f"📄 Raw response was: {response}")
            return []
        except Exception as e:
            print(f"❌ Unexpected error during parsing: {e}")
            return []
    
    def enhanced_pii_detection(self, text: str) -> List[Dict[str, str]]:
        """Combine LLM and regex-based detection for maximum accuracy"""
        
        print(f"🔍 Starting enhanced PII detection...")
        print(f"📄 Input text length: {len(text)} characters")
        
        # Get LLM results
        print(f"processing: LLM-based PII detection...")
        llm_results = self.detect_pii_with_llm(text)
        
        # Get regex results as fallback/supplement
        print(f"processing: Regex-based PII detection...")
        regex_results = detect_pii(text)
        
        # Combine and deduplicate
        combined_results = []
        seen_values = set()
        
        # Add LLM results (prioritize these)
        for item in llm_results:
            value = item["value"].strip()
            if value and value not in seen_values:
                combined_results.append(item)
                seen_values.add(value)
                print(f"🤖 Added LLM result: {item['type']} = '{value}'")
        
        # Add regex results not caught by LLM
        for item in regex_results:
            value = item["value"].strip()
            if value and value not in seen_values:
                combined_results.append(item)
                seen_values.add(value)
                print(f"🔤 Added Regex result: {item['type']} = '{value}'")
        
        # Final summary
        print(f"📊 PII Detection Summary:")
        print(f"   🤖 LLM found: {len(llm_results)} PII items")
        print(f"   🔤 Regex found: {len(regex_results)} PII items")
        print(f"   🎯 Combined total: {len(combined_results)} unique PII items")
        print(f"   📋 Final results:")
        for i, item in enumerate(combined_results, 1):
            print(f"      {i}. {item['type']}: '{item['value']}'")
        
        return combined_results
    
    def validate_pii(self, text: str, suspected_pii: List[Dict[str, str]]) -> List[Dict[str, str]]:
        """Validate suspected PII items using LLM"""
        if not suspected_pii:
            return []
        
        validation_prompt = self.prompts.get_validation_prompt(text, suspected_pii)
        
        result = self.client.generate(
            model=self.model_name,
            prompt=validation_prompt,
            temperature=0.1
        )
        
        if result and result.get("success"):
            return self._parse_llm_response(result["response"])
        
        return suspected_pii