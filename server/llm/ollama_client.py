import requests
from typing import Dict, Any, Optional

class OllamaClient:
    """Handles connection and communication with Ollama API"""
    
    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url
        self.generate_url = f"{base_url}/api/generate"
        self.chat_url = f"{base_url}/api/chat"
        self.tags_url = f"{base_url}/api/tags"
    
    def check_connection(self) -> bool:
        """Check if Ollama service is running"""
        try:
            response = requests.get(self.tags_url, timeout=5)
            return response.status_code == 200
        except requests.RequestException:
            return False
    
    def get_available_models(self) -> list:
        """Get list of available models"""
        try:
            response = requests.get(self.tags_url, timeout=5)
            if response.status_code == 200:
                models = response.json().get("models", [])
                return [model["name"] for model in models]
            return []
        except requests.RequestException:
            return []
    
    def is_model_available(self, model_name: str) -> bool:
        """Check if specific model is available"""
        available_models = self.get_available_models()
        return model_name in available_models
    
    def generate(self, model: str, prompt: str, **kwargs) -> Optional[Dict[str, Any]]:
        """Send generation request to Ollama"""
        try:
            # Default parameters
            payload = {
                "model": model,
                "prompt": prompt,
                "stream": False,
                "temperature": 0.1,
                "options": {
                    "num_predict": 500,
                    "stop": ["\n\n", "```"]
                }
            }
            
            # Override with any custom parameters
            payload.update(kwargs)
            
            print(f"🤖 Sending request to Ollama...")
            print(f"📋 Model: {model}")
            print(f"📏 Prompt length: {len(prompt)} characters")
            
            response = requests.post(
                self.generate_url,
                json=payload,
                timeout=100
            )
            
            if response.status_code == 200:
                result = response.json()
                llm_response = result.get("response", "").strip()
                
                print(f"✅ Received response from {model}")
                print(f"📏 Response length: {len(llm_response)} characters")
                
                return {
                    "success": True,
                    "response": llm_response,
                    "model": model
                }
            else:
                print(f"❌ Request failed with status {response.status_code}")
                print(f"Response: {response.text}")
                return {
                    "success": False,
                    "error": f"HTTP {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            print(f"❌ Ollama request failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }