# Palkeoramix decompiler. 

def _fallback() payable: # default function
  revert

def transfer(address _to, uint256 _value) payable: 
  require calldata.size - 4 >=ΓÇ▓ 32
  mem[64] = ceil32(calldata.size) + 128
  mem[128 len calldata.size] = call.data[0 len calldata.size]
  mem[calldata.size + 128] = 0
  idx = 0
  while idx < calldata.size - 36 / 128:
      _12 = mem[64]
      mem[4] = mem[(32 * idx + (calldata.size - 36 / 128)) + 164]
      mem[36] = mem[(32 * idx + (Mask(249, 7, calldata.size - 36) >> 6)) + 164]
      call mem[(32 * idx) + 164].transferFrom(address from, address to, uint256 tokens) with:
           gas gas_remaining wei
          args mem[(32 * idx + (calldata.size - 36 / 128)) + 164], mem[(32 * idx + (Mask(249, 7, calldata.size - 36) >> 6)) + 164], mem[(32 * idx + (3 * calldata.size - 36 / 128)) + 164]
      mem[0] = ext_call.return_data[0]
      mem[96] = 0
      mem[64] = _12
      idx = idx + 1
      continue 


