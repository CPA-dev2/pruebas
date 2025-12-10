from rapidfuzz import fuzz

class DocumentValidator:
    """
    Valida que el texto extraído contenga palabras clave esperadas
    para el tipo de documento solicitado.
    """
    
    # Palabras clave obligatorias por tipo
    KEYWORDS = {
        'DPI_FRONT': ['REPUBLICA', 'GUATEMALA', 'CODIGO', 'UNICO', 'CUI'],
        'DPI_BACK': ['REGISTRADOR', 'CIVIL', 'VECINDAD', 'NACIONAL', 'PERSONAS'],
        'RTU': ['SAT', 'SUPERINTENDENCIA', 'TRIBUTARIA', 'NIT'],
        'PATENTE': ['MERCANTIL', 'PATENTE', 'COMERCIO', 'REPUBLICA']
    }

    @staticmethod
    def validate(text: str, doc_type: str) -> dict:
        """
        Retorna un dict con la validación y el score de confianza (0-100).
        """
        if doc_type not in DocumentValidator.KEYWORDS:
            return {"is_valid": False, "score": 0, "msg": "Tipo de documento desconocido"}

        text_upper = text.upper()
        keywords = DocumentValidator.KEYWORDS[doc_type]
        matches = 0

        for kw in keywords:
            # Búsqueda exacta
            if kw in text_upper:
                matches += 1
            else:
                # Búsqueda difusa (Fuzzy) para tolerar errores de OCR
                for word in text_upper.split():
                    if fuzz.ratio(kw, word) > 85:
                        matches += 1
                        break
        
        # Calcular score (porcentaje de palabras encontradas)
        score = int((matches / len(keywords)) * 100)
        
        # Umbral mínimo de 60% para considerar válido
        is_valid = score >= 60
        
        return {
            "is_valid": is_valid,
            "score": score,
            "msg": "Documento Oficial Validado" if is_valid else "Documento no reconocido o ilegible"
        }