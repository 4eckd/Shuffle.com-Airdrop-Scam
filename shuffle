# Palkeoramix decompiler. 

const decimals = 18

def storage:
  balanceOf is mapping of uint256 at storage 0
  allowance is mapping of uint256 at storage 1
  totalSupply is uint256 at storage 2
  stor3 is array of struct at storage 3
  stor4 is array of struct at storage 4

def totalSupply() payable: 
  return totalSupply

def balanceOf(address _owner) payable: 
  require calldata.size - 4 >=ΓÇ▓ 32
  require _owner == _owner
  return balanceOf[addr(_owner)]

def allowance(address _owner, address _spender) payable: 
  require calldata.size - 4 >=ΓÇ▓ 64
  require _owner == _owner
  require _spender == _spender
  return allowance[addr(_owner)][addr(_spender)]

#
#  Regular functions
#

def _fallback() payable: # default function
  revert

def approve(address _spender, uint256 _value) payable: 
  require calldata.size - 4 >=ΓÇ▓ 64
  require _spender == _spender
  require _value == _value
  require caller
  require _spender
  allowance[caller][addr(_spender)] = _value
  log Approval(
        address tokenOwner=_value,
        address spender=caller,
        uint256 tokens=_spender)
  return 1

def burn(uint256 _value) payable: 
  require calldata.size - 4 >=ΓÇ▓ 32
  require _value == _value
  if caller:
      if balanceOf[caller] < _value:
          revert with 0, caller, balanceOf[caller], _value
      balanceOf[caller] -= _value
  else:
      if totalSupply > totalSupply + _value:
          revert with 'NH{q', 17
      totalSupply += _value
  balanceOf[57005] += _value
  log Transfer(
        address from=_value,
        address to=caller,
        uint256 tokens=57005)

def transfer(address _to, uint256 _value) payable: 
  require calldata.size - 4 >=ΓÇ▓ 64
  require _to == _to
  require _value == _value
  require caller
  require _to
  if caller:
      if balanceOf[caller] < _value:
          revert with 0, caller, balanceOf[caller], _value
      balanceOf[caller] -= _value
  else:
      if totalSupply > totalSupply + _value:
          revert with 'NH{q', 17
      totalSupply += _value
  if _to:
      balanceOf[addr(_to)] += _value
  else:
      totalSupply -= _value
  log Transfer(
        address from=_value,
        address to=caller,
        uint256 tokens=_to)
  return 1

def transferFrom(address _from, address _to, uint256 _value) payable: 
  require calldata.size - 4 >=ΓÇ▓ 96
  require _from == _from
  require _to == _to
  require _value == _value
  if allowance[addr(_from)][caller] != -1:
      if allowance[addr(_from)][caller] < _value:
          revert with 0, caller, allowance[addr(_from)][caller], _value
      require _from
      require caller
      allowance[addr(_from)][caller] -= _value
  require _from
  require _to
  if _from:
      if balanceOf[addr(_from)] < _value:
          revert with 0, addr(_from), balanceOf[addr(_from)], _value
      balanceOf[addr(_from)] -= _value
  else:
      if totalSupply > totalSupply + _value:
          revert with 'NH{q', 17
      totalSupply += _value
  if _to:
      balanceOf[addr(_to)] += _value
  else:
      totalSupply -= _value
  log Transfer(
        address from=_value,
        address to=_from,
        uint256 tokens=_to)
  return 1

def name() payable: 
  if bool(stor3.length):
      if not bool(stor3.length) - (stor3.length.field_1 < 32):
          revert with 'NH{q', 34
      if bool(stor3.length):
          if not bool(stor3.length) - (stor3.length.field_1 < 32):
              revert with 'NH{q', 34
          if stor3.length.field_1:
              if 31 < stor3.length.field_1:
                  mem[128] = uint256(stor3.field_0)
                  idx = 128
                  s = 0
                  while stor3.length.field_1 + 96 > idx:
                      mem[idx + 32] = stor3[s].field_256
                      idx = idx + 32
                      s = s + 1
                      continue 
                  return Array(len=2 * Mask(256, -1, stor3.length.field_1), data=mem[128 len ceil32(stor3.length.field_1)])
              mem[128] = 256 * stor3.length.field_8
      else:
          if not bool(stor3.length) - (stor3.length.field_1 < 32):
              revert with 'NH{q', 34
          if stor3.length.field_1:
              if 31 < stor3.length.field_1:
                  mem[128] = uint256(stor3.field_0)
                  idx = 128
                  s = 0
                  while stor3.length.field_1 + 96 > idx:
                      mem[idx + 32] = stor3[s].field_256
                      idx = idx + 32
                      s = s + 1
                      continue 
                  return Array(len=2 * Mask(256, -1, stor3.length.field_1), data=mem[128 len ceil32(stor3.length.field_1)])
              mem[128] = 256 * stor3.length.field_8
      mem[ceil32(stor3.length.field_1) + 192 len ceil32(stor3.length.field_1)] = mem[128 len ceil32(stor3.length.field_1)]
      mem[ceil32(stor3.length.field_1) + stor3.length.field_1 + 192] = 0
      return Array(len=2 * Mask(256, -1, stor3.length.field_1), data=mem[128 len ceil32(stor3.length.field_1)], mem[(2 * ceil32(stor3.length.field_1)) + 192 len 2 * ceil32(stor3.length.field_1)]), 
  if not bool(stor3.length) - (stor3.length.field_1 < 32):
      revert with 'NH{q', 34
  if bool(stor3.length):
      if not bool(stor3.length) - (stor3.length.field_1 < 32):
          revert with 'NH{q', 34
      if stor3.length.field_1:
          if 31 < stor3.length.field_1:
              mem[128] = uint256(stor3.field_0)
              idx = 128
              s = 0
              while stor3.length.field_1 + 96 > idx:
                  mem[idx + 32] = stor3[s].field_256
                  idx = idx + 32
                  s = s + 1
                  continue 
              return Array(len=stor3.length % 128, data=mem[128 len ceil32(stor3.length.field_1)])
          mem[128] = 256 * stor3.length.field_8
  else:
      if not bool(stor3.length) - (stor3.length.field_1 < 32):
          revert with 'NH{q', 34
      if stor3.length.field_1:
          if 31 < stor3.length.field_1:
              mem[128] = uint256(stor3.field_0)
              idx = 128
              s = 0
              while stor3.length.field_1 + 96 > idx:
                  mem[idx + 32] = stor3[s].field_256
                  idx = idx + 32
                  s = s + 1
                  continue 
              return Array(len=stor3.length % 128, data=mem[128 len ceil32(stor3.length.field_1)])
          mem[128] = 256 * stor3.length.field_8
  mem[ceil32(stor3.length.field_1) + 192 len ceil32(stor3.length.field_1)] = mem[128 len ceil32(stor3.length.field_1)]
  mem[ceil32(stor3.length.field_1) + stor3.length.field_1 + 192] = 0
  return Array(len=stor3.length % 128, data=mem[128 len ceil32(stor3.length.field_1)], mem[(2 * ceil32(stor3.length.field_1)) + 192 len 2 * ceil32(stor3.length.field_1)]), 

def symbol() payable: 
  if bool(stor4.length):
      if not bool(stor4.length) - (stor4.length.field_1 < 32):
          revert with 'NH{q', 34
      if bool(stor4.length):
          if not bool(stor4.length) - (stor4.length.field_1 < 32):
              revert with 'NH{q', 34
          if stor4.length.field_1:
              if 31 < stor4.length.field_1:
                  mem[128] = uint256(stor4.field_0)
                  idx = 128
                  s = 0
                  while stor4.length.field_1 + 96 > idx:
                      mem[idx + 32] = stor4[s].field_256
                      idx = idx + 32
                      s = s + 1
                      continue 
                  return Array(len=2 * Mask(256, -1, stor4.length.field_1), data=mem[128 len ceil32(stor4.length.field_1)])
              mem[128] = 256 * stor4.length.field_8
      else:
          if not bool(stor4.length) - (stor4.length.field_1 < 32):
              revert with 'NH{q', 34
          if stor4.length.field_1:
              if 31 < stor4.length.field_1:
                  mem[128] = uint256(stor4.field_0)
                  idx = 128
                  s = 0
                  while stor4.length.field_1 + 96 > idx:
                      mem[idx + 32] = stor4[s].field_256
                      idx = idx + 32
                      s = s + 1
                      continue 
                  return Array(len=2 * Mask(256, -1, stor4.length.field_1), data=mem[128 len ceil32(stor4.length.field_1)])
              mem[128] = 256 * stor4.length.field_8
      mem[ceil32(stor4.length.field_1) + 192 len ceil32(stor4.length.field_1)] = mem[128 len ceil32(stor4.length.field_1)]
      mem[ceil32(stor4.length.field_1) + stor4.length.field_1 + 192] = 0
      return Array(len=2 * Mask(256, -1, stor4.length.field_1), data=mem[128 len ceil32(stor4.length.field_1)], mem[(2 * ceil32(stor4.length.field_1)) + 192 len 2 * ceil32(stor4.length.field_1)]), 
  if not bool(stor4.length) - (stor4.length.field_1 < 32):
      revert with 'NH{q', 34
  if bool(stor4.length):
      if not bool(stor4.length) - (stor4.length.field_1 < 32):
          revert with 'NH{q', 34
      if stor4.length.field_1:
          if 31 < stor4.length.field_1:
              mem[128] = uint256(stor4.field_0)
              idx = 128
              s = 0
              while stor4.length.field_1 + 96 > idx:
                  mem[idx + 32] = stor4[s].field_256
                  idx = idx + 32
                  s = s + 1
                  continue 
              return Array(len=stor4.length % 128, data=mem[128 len ceil32(stor4.length.field_1)])
          mem[128] = 256 * stor4.length.field_8
  else:
      if not bool(stor4.length) - (stor4.length.field_1 < 32):
          revert with 'NH{q', 34
      if stor4.length.field_1:
          if 31 < stor4.length.field_1:
              mem[128] = uint256(stor4.field_0)
              idx = 128
              s = 0
              while stor4.length.field_1 + 96 > idx:
                  mem[idx + 32] = stor4[s].field_256
                  idx = idx + 32
                  s = s + 1
                  continue 
              return Array(len=stor4.length % 128, data=mem[128 len ceil32(stor4.length.field_1)])
          mem[128] = 256 * stor4.length.field_8
  mem[ceil32(stor4.length.field_1) + 192 len ceil32(stor4.length.field_1)] = mem[128 len ceil32(stor4.length.field_1)]
  mem[ceil32(stor4.length.field_1) + stor4.length.field_1 + 192] = 0
  return Array(len=stor4.length % 128, data=mem[128 len ceil32(stor4.length.field_1)], mem[(2 * ceil32(stor4.length.field_1)) + 192 len 2 * ceil32(stor4.length.field_1)]), 


