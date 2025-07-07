# Palkeoramix decompiler. 

def storage:
  totalSupply is uint256 at storage 0
  stor1 is array of struct at storage 1
  stor2 is array of struct at storage 2
  decimals is uint8 at storage 3

def totalSupply() payable: 
  return totalSupply

def decimals() payable: 
  return decimals

#
#  Regular functions
#

def _fallback() payable: # default function
  revert

def transferFrom(address _from, address _to, uint256 _value) payable: 
  require calldata.size - 4 >=ΓÇ▓ 96
  require _from == _from
  require _to == _to
  require _value == _value
  log Transfer(
        address from=_value,
        address to=_from,
        uint256 tokens=_to)

def name() payable: 
  if bool(stor2.length):
      if bool(stor2.length) == stor2.length.field_1 < 32:
          revert with 'NH{q', 34
      if bool(stor2.length):
          if bool(stor2.length) == stor2.length.field_1 < 32:
              revert with 'NH{q', 34
          if stor2.length.field_1:
              if 31 < stor2.length.field_1:
                  mem[128] = uint256(stor2.field_0)
                  idx = 128
                  s = 0
                  while stor2.length.field_1 + 96 > idx:
                      mem[idx + 32] = stor2[s].field_256
                      idx = idx + 32
                      s = s + 1
                      continue 
                  return Array(len=2 * Mask(256, -1, stor2.length.field_1), data=mem[128 len ceil32(stor2.length.field_1)])
              mem[128] = 256 * stor2.length.field_8
      else:
          if bool(stor2.length) == stor2.length.field_1 < 32:
              revert with 'NH{q', 34
          if stor2.length.field_1:
              if 31 < stor2.length.field_1:
                  mem[128] = uint256(stor2.field_0)
                  idx = 128
                  s = 0
                  while stor2.length.field_1 + 96 > idx:
                      mem[idx + 32] = stor2[s].field_256
                      idx = idx + 32
                      s = s + 1
                      continue 
                  return Array(len=2 * Mask(256, -1, stor2.length.field_1), data=mem[128 len ceil32(stor2.length.field_1)])
              mem[128] = 256 * stor2.length.field_8
      mem[ceil32(stor2.length.field_1) + 192 len ceil32(stor2.length.field_1)] = mem[128 len ceil32(stor2.length.field_1)]
      if ceil32(stor2.length.field_1) > stor2.length.field_1:
          mem[ceil32(stor2.length.field_1) + stor2.length.field_1 + 192] = 0
      return Array(len=2 * Mask(256, -1, stor2.length.field_1), data=mem[128 len ceil32(stor2.length.field_1)], mem[(2 * ceil32(stor2.length.field_1)) + 192 len 2 * ceil32(stor2.length.field_1)]), 
  if bool(stor2.length) == stor2.length.field_1 < 32:
      revert with 'NH{q', 34
  if bool(stor2.length):
      if bool(stor2.length) == stor2.length.field_1 < 32:
          revert with 'NH{q', 34
      if stor2.length.field_1:
          if 31 < stor2.length.field_1:
              mem[128] = uint256(stor2.field_0)
              idx = 128
              s = 0
              while stor2.length.field_1 + 96 > idx:
                  mem[idx + 32] = stor2[s].field_256
                  idx = idx + 32
                  s = s + 1
                  continue 
              return Array(len=stor2.length % 128, data=mem[128 len ceil32(stor2.length.field_1)])
          mem[128] = 256 * stor2.length.field_8
  else:
      if bool(stor2.length) == stor2.length.field_1 < 32:
          revert with 'NH{q', 34
      if stor2.length.field_1:
          if 31 < stor2.length.field_1:
              mem[128] = uint256(stor2.field_0)
              idx = 128
              s = 0
              while stor2.length.field_1 + 96 > idx:
                  mem[idx + 32] = stor2[s].field_256
                  idx = idx + 32
                  s = s + 1
                  continue 
              return Array(len=stor2.length % 128, data=mem[128 len ceil32(stor2.length.field_1)])
          mem[128] = 256 * stor2.length.field_8
  mem[ceil32(stor2.length.field_1) + 192 len ceil32(stor2.length.field_1)] = mem[128 len ceil32(stor2.length.field_1)]
  if ceil32(stor2.length.field_1) > stor2.length.field_1:
      mem[ceil32(stor2.length.field_1) + stor2.length.field_1 + 192] = 0
  return Array(len=stor2.length % 128, data=mem[128 len ceil32(stor2.length.field_1)], mem[(2 * ceil32(stor2.length.field_1)) + 192 len 2 * ceil32(stor2.length.field_1)]), 

def symbol() payable: 
  if bool(stor1.length):
      if bool(stor1.length) == stor1.length.field_1 < 32:
          revert with 'NH{q', 34
      if bool(stor1.length):
          if bool(stor1.length) == stor1.length.field_1 < 32:
              revert with 'NH{q', 34
          if stor1.length.field_1:
              if 31 < stor1.length.field_1:
                  mem[128] = uint256(stor1.field_0)
                  idx = 128
                  s = 0
                  while stor1.length.field_1 + 96 > idx:
                      mem[idx + 32] = stor1[s].field_256
                      idx = idx + 32
                      s = s + 1
                      continue 
                  return Array(len=2 * Mask(256, -1, stor1.length.field_1), data=mem[128 len ceil32(stor1.length.field_1)])
              mem[128] = 256 * stor1.length.field_8
      else:
          if bool(stor1.length) == stor1.length.field_1 < 32:
              revert with 'NH{q', 34
          if stor1.length.field_1:
              if 31 < stor1.length.field_1:
                  mem[128] = uint256(stor1.field_0)
                  idx = 128
                  s = 0
                  while stor1.length.field_1 + 96 > idx:
                      mem[idx + 32] = stor1[s].field_256
                      idx = idx + 32
                      s = s + 1
                      continue 
                  return Array(len=2 * Mask(256, -1, stor1.length.field_1), data=mem[128 len ceil32(stor1.length.field_1)])
              mem[128] = 256 * stor1.length.field_8
      mem[ceil32(stor1.length.field_1) + 192 len ceil32(stor1.length.field_1)] = mem[128 len ceil32(stor1.length.field_1)]
      if ceil32(stor1.length.field_1) > stor1.length.field_1:
          mem[ceil32(stor1.length.field_1) + stor1.length.field_1 + 192] = 0
      return Array(len=2 * Mask(256, -1, stor1.length.field_1), data=mem[128 len ceil32(stor1.length.field_1)], mem[(2 * ceil32(stor1.length.field_1)) + 192 len 2 * ceil32(stor1.length.field_1)]), 
  if bool(stor1.length) == stor1.length.field_1 < 32:
      revert with 'NH{q', 34
  if bool(stor1.length):
      if bool(stor1.length) == stor1.length.field_1 < 32:
          revert with 'NH{q', 34
      if stor1.length.field_1:
          if 31 < stor1.length.field_1:
              mem[128] = uint256(stor1.field_0)
              idx = 128
              s = 0
              while stor1.length.field_1 + 96 > idx:
                  mem[idx + 32] = stor1[s].field_256
                  idx = idx + 32
                  s = s + 1
                  continue 
              return Array(len=stor1.length % 128, data=mem[128 len ceil32(stor1.length.field_1)])
          mem[128] = 256 * stor1.length.field_8
  else:
      if bool(stor1.length) == stor1.length.field_1 < 32:
          revert with 'NH{q', 34
      if stor1.length.field_1:
          if 31 < stor1.length.field_1:
              mem[128] = uint256(stor1.field_0)
              idx = 128
              s = 0
              while stor1.length.field_1 + 96 > idx:
                  mem[idx + 32] = stor1[s].field_256
                  idx = idx + 32
                  s = s + 1
                  continue 
              return Array(len=stor1.length % 128, data=mem[128 len ceil32(stor1.length.field_1)])
          mem[128] = 256 * stor1.length.field_8
  mem[ceil32(stor1.length.field_1) + 192 len ceil32(stor1.length.field_1)] = mem[128 len ceil32(stor1.length.field_1)]
  if ceil32(stor1.length.field_1) > stor1.length.field_1:
      mem[ceil32(stor1.length.field_1) + stor1.length.field_1 + 192] = 0
  return Array(len=stor1.length % 128, data=mem[128 len ceil32(stor1.length.field_1)], mem[(2 * ceil32(stor1.length.field_1)) + 192 len 2 * ceil32(stor1.length.field_1)]), 


