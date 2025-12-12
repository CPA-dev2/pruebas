from rapidfuzz import fuzz

class DocumentValidator:
    """
    Valida que el texto extraído contenga palabras clave esperadas
    para el tipo de documento solicitado.
    """
    
    # Palabras clave obligatorias por tipo
    KEYWORDS = {
        'DPI_FRONT': [
            'REPUBLICA', 'GUATEMALA', 'PERSONAL', 'IDENTIFICACION', 'CUI', 'NACIONALIDAD'
        ],
        # Ajustado para DPI Posterior (Imagen real)
        'DPI_BACK': [
            'LUGAR', 'NACIMIENTO', 'VECINDAD', 'ESTADO', 'CIVIL', 'RENAP', 'IDGTM' 
        ],
        'RTU': [
            'SAT', 'SUPERINTENDENCIA', 'TRIBUTARIA', 'NIT', 'CONSTANCIA', 'INSCRIPCION'
        ],
        'PATENTE': [
            'MERCANTIL', 'PATENTE', 'COMERCIO', 'REPUBLICA', 'REGISTRO'
        ]
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
        found_words = [] # Para debugging

        for kw in keywords:
            # 1. Búsqueda exacta
            if kw in text_upper:
                matches += 1
                found_words.append(kw)
            else:
                # 2. Búsqueda difusa (Fuzzy) tolerante a errores OCR (ej. REFPUBLICA)
                # Buscamos tokens individuales en el texto
                best_ratio = 0
                for word in text_upper.split():
                    # Optimización: Solo comparar palabras de longitud similar
                    if abs(len(word) - len(kw)) > 2:
                        continue
                        
                    ratio = fuzz.ratio(kw, word)
                    if ratio > 80: # Tolerancia del 20%
                        matches += 1
                        found_words.append(kw)
                        break
        
        # Calcular score
        total_kws = len(keywords)
        score = int((matches / total_kws) * 100)
        
        # Reglas especiales
        is_valid = score >= 50 # Bajamos a 50% porque el OCR de IDs viejos es difícil
        
        # Validación crítica para DPI Back: Debe tener MRZ (IDGTM) o RENAP
        if doc_type == 'DPI_BACK':
            if 'IDGTM' in text_upper or 'RENAP' in found_words:
                is_valid = True
                score = max(score, 80) # Boost de confianza si encontramos marcas críticas

        msg = f"Validado ({', '.join(found_words)})" if is_valid else "Documento ilegible o incorrecto"
        
        return {
            "is_valid": is_valid,
            "score": score,
            "msg": msg
        }