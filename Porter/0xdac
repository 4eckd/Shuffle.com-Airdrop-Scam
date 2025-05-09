# Palkeoramix decompiler. 

const MAX_UINT = -1

def storage:
  paused is uint8 at storage 0 offset 160
  stor0 is uint128 at storage 0 offset 160
  owner is addr at storage 0
  _totalSupply is uint256 at storage 1
  balances is mapping of uint256 at storage 2
  basisPointsRate is uint256 at storage 3
  maximumFee is uint256 at storage 4
  allowed is mapping of uint256 at storage 5
  stor6 is mapping of uint8 at storage 6
  name is array of uint256 at storage 7
  symbol is array of uint256 at storage 8
  decimals is uint256 at storage 9
  deprecated is uint8 at storage 10 offset 160
  stor10 is uint128 at storage 10 offset 160
  upgradedAddress is addr at storage 10

def name(): # not payable
  return name[0 len name.length]

def deprecated(): # not payable
  return bool(deprecated)

def upgradedAddress(): # not payable
  return upgradedAddress

def balances(address _param1): # not payable
  return balances[_param1]

def decimals(): # not payable
  return decimals

def maximumFee(): # not payable
  return maximumFee

def _totalSupply(): # not payable
  return _totalSupply

def getBlackListStatus(address _addr): # not payable
  return bool(stor6[addr(_addr)])

def allowed(address _param1, address _param2): # not payable
  return allowed[_param1][_param2]

def paused(): # not payable
  return bool(paused)

def getOwner(): # not payable
  return owner

def owner(): # not payable
  return owner

def symbol(): # not payable
  return symbol[0 len symbol.length]

def basisPointsRate(): # not payable
  return basisPointsRate

def isBlackListed(address _param1): # not payable
  return bool(stor6[_param1])

#
#  Regular functions
#

def _fallback() payable: # default function
  revert

def transferOwnership(address _newOwner): # not payable
  require caller == owner
  if _newOwner:
      owner = _newOwner

def unpause(): # not payable
  require caller == owner
  require paused
  Mask(96, 0, stor0.field_160) = 0
  log Unpause()

def pause(): # not payable
  require caller == owner
  require not paused
  Mask(96, 0, stor0.field_160) = 1
  log Pause()

def deprecate(address _upgradedAddress): # not payable
  require caller == owner
  stor10 = 1
  upgradedAddress = _upgradedAddress
  log Deprecate(address newAddress=_upgradedAddress)

def addBlackList(address _evilUser): # not payable
  require caller == owner
  stor6[addr(_evilUser)] = 1
  log AddedBlackList(address user=_evilUser)

def removeBlackList(address _clearedUser): # not payable
  require caller == owner
  stor6[addr(_clearedUser)] = 0
  log RemovedBlackList(address user=_clearedUser)

def totalSupply(): # not payable
  if not deprecated:
      return _totalSupply
  require ext_code.size(upgradedAddress)
  call upgradedAddress.totalSupply() with:
       gas gas_remaining - 710 wei
  require ext_call.success
  return ext_call.return_data[0]

def balanceOf(address _owner): # not payable
  if not deprecated:
      return balances[addr(_owner)]
  require ext_code.size(upgradedAddress)
  call upgradedAddress.balanceOf(address tokenOwner) with:
       gas gas_remaining - 710 wei
      args _owner
  require ext_call.success
  return ext_call.return_data[0]

def redeem(uint256 _tokens): # not payable
  require caller == owner
  require _totalSupply >= _tokens
  require balances[addr(stor0.field_0)] >= _tokens
  _totalSupply -= _tokens
  balances[addr(stor0.field_0)] -= _tokens
  log Redeem(uint256 amount=_tokens)

def allowance(address _owner, address _spender): # not payable
  if not deprecated:
      return allowed[addr(_owner)][addr(_spender)]
  require ext_code.size(upgradedAddress)
  call upgradedAddress.allowance(address tokenOwner, address spender) with:
       gas gas_remaining - 710 wei
      args addr(_owner), _spender
  require ext_call.success
  return ext_call.return_data[0]

def issue(uint256 _amount): # not payable
  require caller == owner
  require _totalSupply + _amount > _totalSupply
  require balances[addr(stor0.field_0)] + _amount > balances[addr(stor0.field_0)]
  balances[addr(stor0.field_0)] += _amount
  _totalSupply += _amount
  log Issue(uint256 amount=_amount)

def setParams(uint256 _newBasisPoints, uint256 _newMaxFee): # not payable
  require caller == owner
  require _newBasisPoints < 20
  require _newMaxFee < 50
  basisPointsRate = _newBasisPoints
  if not _newMaxFee:
      maximumFee = 0
  else:
      require _newMaxFee
      require _newMaxFee * 10^decimals / _newMaxFee == 10^decimals
      maximumFee = _newMaxFee * 10^decimals
  log Params(
        uint256 feeBasisPoints=basisPointsRate,
        uint256 maxFee=maximumFee)

def approve(address _spender, uint256 _value): # not payable
  require calldata.size >= 68
  if deprecated:
      require ext_code.size(upgradedAddress)
      call upgradedAddress.approveByLegacy(address param1, address param2, uint256 param3) with:
           gas gas_remaining - 710 wei
          args caller, addr(_spender), _value
      require ext_call.success
  else:
      require calldata.size >= 68
      if _value:
          require not allowed[caller][addr(_spender)]
      allowed[caller][addr(_spender)] = _value
      log Approval(
            address tokenOwner=_value,
            address spender=caller,
            uint256 tokens=_spender)

def destroyBlackFunds(address _blackListedUser): # not payable
  require caller == owner
  require stor6[addr(_blackListedUser)]
  if not deprecated:
      balances[addr(_blackListedUser)] = 0
      _totalSupply -= balances[addr(_blackListedUser)]
      log DestroyedBlackFunds(
            address blackListedUser=addr(_blackListedUser),
            uint256 balance=balances[addr(_blackListedUser)])
  else:
      require ext_code.size(upgradedAddress)
      call upgradedAddress.balanceOf(address tokenOwner) with:
           gas gas_remaining - 710 wei
          args _blackListedUser
      require ext_call.success
      balances[addr(_blackListedUser)] = 0
      _totalSupply -= ext_call.return_data[0]
      log DestroyedBlackFunds(
            address blackListedUser=addr(_blackListedUser),
            uint256 balance=ext_call.return_data

def transfer(address _to, uint256 _value): # not payable
  require not paused
  require not stor6[caller]
  if deprecated:
      require ext_code.size(upgradedAddress)
      call upgradedAddress.transferByLegacy(address param1, address param2, uint256 param3) with:
           gas gas_remaining - 710 wei
          args caller, addr(_to), _value
      require ext_call.success
  else:
      require calldata.size >= 68
      if not _value:
          if 0 <= maximumFee:
              require 0 <= _value
              require _value <= balances[caller]
              balances[caller] -= _value
              require balances[addr(_to)] + _value >= balances[addr(_to)]
              balances[addr(_to)] += _value
              log Transfer(
                    address from=_value,
                    address to=caller,
                    uint256 tokens=_to)
          else:
              require maximumFee <= _value
              require _value <= balances[caller]
              balances[caller] -= _value
              require balances[addr(_to)] + _value - maximumFee >= balances[addr(_to)]
              balances[addr(_to)] = balances[addr(_to)] + _value - maximumFee
              if maximumFee > 0:
                  require balances[addr(stor0.field_0)] + maximumFee >= balances[addr(stor0.field_0)]
                  balances[addr(stor0.field_0)] += maximumFee
                  log Transfer(
                        address from=maximumFee,
                        address to=caller,
                        uint256 tokens=owner)
              log Transfer(
                    address from=(_value - maximumFee),
                    address to=caller,
                    uint256 tokens=_to)
      else:
          require _value
          require _value * basisPointsRate / _value == basisPointsRate
          if _value * basisPointsRate / 10000 <= maximumFee:
              require _value * basisPointsRate / 10000 <= _value
              require _value <= balances[caller]
              balances[caller] -= _value
              require balances[addr(_to)] + _value - (_value * basisPointsRate / 10000) >= balances[addr(_to)]
              balances[addr(_to)] = balances[addr(_to)] + _value - (_value * basisPointsRate / 10000)
              if _value * basisPointsRate / 10000 > 0:
                  require balances[addr(stor0.field_0)] + (_value * basisPointsRate / 10000) >= balances[addr(stor0.field_0)]
                  balances[addr(stor0.field_0)] += _value * basisPointsRate / 10000
                  log Transfer(
                        address from=(_value * basisPointsRate / 10000),
                        address to=caller,
                        uint256 tokens=owner)
              log Transfer(
                    address from=(_value - (_value * basisPointsRate / 10000)),
                    address to=caller,
                    uint256 tokens=_to)
          else:
              require maximumFee <= _value
              require _value <= balances[caller]
              balances[caller] -= _value
              require balances[addr(_to)] + _value - maximumFee >= balances[addr(_to)]
              balances[addr(_to)] = balances[addr(_to)] + _value - maximumFee
              if maximumFee > 0:
                  require balances[addr(stor0.field_0)] + maximumFee >= balances[addr(stor0.field_0)]
                  balances[addr(stor0.field_0)] += maximumFee
                  log Transfer(
                        address from=maximumFee,
                        address to=caller,
                        uint256 tokens=owner)
              log Transfer(
                    address from=(_value - maximumFee),
                    address to=caller,
                    uint256 tokens=_to)

def transferFrom(address _from, address _to, uint256 _value): # not payable
  require not paused
  require not stor6[addr(_from)]
  if deprecated:
      require ext_code.size(upgradedAddress)
      call upgradedAddress.transferFromByLegacy(address param1, address param2, address param3, uint256 param4) with:
           gas gas_remaining - 710 wei
          args 0, uint32(caller), addr(_from), addr(_to), _value
      require ext_call.success
  else:
      require calldata.size >= 100
      if not _value:
          if allowed[addr(_from)][caller] < -1:
              require _value <= allowed[addr(_from)][caller]
              allowed[addr(_from)][caller] -= _value
          if 0 <= maximumFee:
              require 0 <= _value
              require _value <= balances[addr(_from)]
              balances[addr(_from)] -= _value
              require balances[addr(_to)] + _value >= balances[addr(_to)]
              balances[addr(_to)] += _value
              log Transfer(
                    address from=_value,
                    address to=_from,
                    uint256 tokens=_to)
          else:
              require maximumFee <= _value
              require _value <= balances[addr(_from)]
              balances[addr(_from)] -= _value
              require balances[addr(_to)] + _value - maximumFee >= balances[addr(_to)]
              balances[addr(_to)] = balances[addr(_to)] + _value - maximumFee
              if maximumFee > 0:
                  require balances[addr(stor0.field_0)] + maximumFee >= balances[addr(stor0.field_0)]
                  balances[addr(stor0.field_0)] += maximumFee
                  log Transfer(
                        address from=maximumFee,
                        address to=_from,
                        uint256 tokens=owner)
              log Transfer(
                    address from=(_value - maximumFee),
                    address to=_from,
                    uint256 tokens=_to)
      else:
          require _value
          require _value * basisPointsRate / _value == basisPointsRate
          if allowed[addr(_from)][caller] < -1:
              require _value <= allowed[addr(_from)][caller]
              allowed[addr(_from)][caller] -= _value
          if _value * basisPointsRate / 10000 <= maximumFee:
              require _value * basisPointsRate / 10000 <= _value
              require _value <= balances[addr(_from)]
              balances[addr(_from)] -= _value
              require balances[addr(_to)] + _value - (_value * basisPointsRate / 10000) >= balances[addr(_to)]
              balances[addr(_to)] = balances[addr(_to)] + _value - (_value * basisPointsRate / 10000)
              if _value * basisPointsRate / 10000 > 0:
                  require balances[addr(stor0.field_0)] + (_value * basisPointsRate / 10000) >= balances[addr(stor0.field_0)]
                  balances[addr(stor0.field_0)] += _value * basisPointsRate / 10000
                  log Transfer(
                        address from=(_value * basisPointsRate / 10000),
                        address to=_from,
                        uint256 tokens=owner)
              log Transfer(
                    address from=(_value - (_value * basisPointsRate / 10000)),
                    address to=_from,
                    uint256 tokens=_to)
          else:
              require maximumFee <= _value
              require _value <= balances[addr(_from)]
              balances[addr(_from)] -= _value
              require balances[addr(_to)] + _value - maximumFee >= balances[addr(_to)]
              balances[addr(_to)] = balances[addr(_to)] + _value - maximumFee
              if maximumFee > 0:
                  require balances[addr(stor0.field_0)] + maximumFee >= balances[addr(stor0.field_0)]
                  balances[addr(stor0.field_0)] += maximumFee
                  log Transfer(
                        address from=maximumFee,
                        address to=_from,
                        uint256 tokens=owner)
              log Transfer(
                    address from=(_value - maximumFee),
                    address to=_from,
                    uint256 tokens=_to)


