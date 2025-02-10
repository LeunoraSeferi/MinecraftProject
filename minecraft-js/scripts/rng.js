// Implementimi i një gjeneruesi të numrave të rastësishëm (RNG).
// Burimi: https://stackoverflow.com/a/19301306/2258875


/**
 * Ky skript implementon një gjenerues të numrave të rastësishëm (RNG) 
 * të bazuar në një farë (seed), duke prodhuar numra të rastësishëm midis 0 dhe 1 në mënyrë të përsëritshme.
 * 
Përdorimi: Lejon krijimin e të dhënave të rastësishme, 
por me mundësi riprodhimi të rezultateve për eksperimente ose lojëra.
 */


export class RNG {
    m_w = 123456789; // Vlera fillestare për variablën `m_w`.
    m_z = 987654321; // Vlera fillestare për variablën `m_z`.
    mask = 0xffffffff; // Maskë për të kufizuar numrat në 32-bit.

   
    constructor(seed) {
        this.m_w = (123456789 + seed) & this.mask;
        this.m_z = (987654321 - seed) & this.mask;
    }

    
    random() {
        this.m_z = (36969 * (this.m_z & 65535) + (this.m_z >> 16)) & this.mask;
        this.m_w = (18000 * (this.m_w & 65535) + (this.m_w >> 16)) & this.mask;
        
        let result = ((this.m_z << 16) + (this.m_w & 65535)) >>> 0; // Siguron unsigned integer.
        result /= 4294967296; // Konverton numrin në një vlerë midis 0 dhe 1.
        
        return result;
    }
}
